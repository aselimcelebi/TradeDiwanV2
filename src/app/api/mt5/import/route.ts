import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// MT5 API Key ile authentication — session yok çünkü EA sunucuya HTTP atıyor
// Kullanıcı broker eklerken bir API key oluşturuyoruz, EA onu kullanıyor

const MT5TradeSchema = z.object({
  type: z.enum(["trade", "account", "ping", "heartbeat", "disconnect"]),
  appId: z.string(),
  timestamp: z.number(),
  account: z.object({
    login: z.number(),
    server: z.string(),
  }).optional(),
  trade: z.object({
    ticket: z.number(),
    symbol: z.string(),
    type: z.number(),
    volume: z.number(),
    openPrice: z.number(),
    closePrice: z.number(),
    openTime: z.number(),
    closeTime: z.number(),
    profit: z.number(),
    commission: z.number(),
    swap: z.number(),
    fee: z.number(),
    comment: z.string(),
    positionId: z.number(),
    magicNumber: z.number().optional(),
  }).optional(),
});

const MT5AccountSchema = z.object({
  type: z.literal("account"),
  appId: z.string(),
  timestamp: z.number(),
  account: z.object({
    login: z.number(),
    name: z.string(),
    server: z.string(),
    currency: z.string(),
    company: z.string().optional(),
    leverage: z.number(),
    balance: z.number(),
    equity: z.number(),
    margin: z.number(),
    freeMargin: z.number(),
    marginLevel: z.number(),
    credit: z.number().optional(),
  }),
});

const activeConnections = new Map<string, {
  appId: string;
  account: any;
  lastHeartbeat: Date;
  status: "active" | "inactive";
  userId: string;
}>();

// API Key'den userId al
async function getUserIdFromApiKey(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const apiKey = authHeader.replace("Bearer ", "").trim();
  if (!apiKey) return null;

  // Broker'ın apiKey alanında bu key saklı
  const broker = await prisma.broker.findFirst({
    where: { apiKey },
  });

  return broker?.userId ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log("🔄 MT5 Data received:", data.type);

    const userId = await getUserIdFromApiKey(request);

    switch (data.type) {
      case "ping":
        return NextResponse.json({ success: true, message: "Pong", timestamp: Date.now() });

      case "heartbeat":
        if (activeConnections.has(data.appId)) {
          const conn = activeConnections.get(data.appId)!;
          conn.lastHeartbeat = new Date();
          conn.status = "active";
        }
        return NextResponse.json({ success: true, message: "Heartbeat received" });

      case "disconnect":
        if (activeConnections.has(data.appId)) {
          activeConnections.get(data.appId)!.status = "inactive";
        }
        return NextResponse.json({ success: true, message: "Disconnect acknowledged" });

      case "account":
        return await handleAccountInfo(data, userId);

      case "trade":
        return await handleTradeData(data, userId);

      default:
        return NextResponse.json({ success: false, error: "Unknown message type" }, { status: 400 });
    }
  } catch (error) {
    console.error("❌ MT5 import error:", error);
    return NextResponse.json({ success: false, error: "Failed to process MT5 data" }, { status: 500 });
  }
}

async function handleAccountInfo(data: any, userId: string | null) {
  try {
    const validated = MT5AccountSchema.parse(data);

    activeConnections.set(validated.appId, {
      appId: validated.appId,
      account: validated.account,
      lastHeartbeat: new Date(),
      status: "active",
      userId: userId ?? "unknown",
    });

    console.log("🏦 MT5 Account connected:", validated.account.login, "on", validated.account.server);

    return NextResponse.json({
      success: true,
      message: "Account info received",
      account: validated.account,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Invalid account data" }, { status: 400 });
  }
}

async function handleTradeData(data: any, userId: string | null) {
  try {
    const validated = MT5TradeSchema.parse(data);

    if (!validated.trade || !validated.account) {
      return NextResponse.json({ success: false, error: "Missing trade or account data" }, { status: 400 });
    }

    // userId yoksa appId üzerinden bul
    let resolvedUserId = userId;
    if (!resolvedUserId && activeConnections.has(data.appId)) {
      resolvedUserId = activeConnections.get(data.appId)!.userId;
    }

    if (!resolvedUserId || resolvedUserId === "unknown") {
      // API key yoksa — geliştirme amaçlı ilk kullanıcıya at
      const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
      if (!firstUser) {
        return NextResponse.json({ success: false, error: "No user found. Please set up your MT5 API key." }, { status: 401 });
      }
      resolvedUserId = firstUser.id;
    }

    const trade = validated.trade;
    const account = validated.account;

    // Duplicate kontrolü
    const existing = await prisma.trade.findFirst({
      where: {
        userId: resolvedUserId,
        notes: { contains: `MT5 Ticket: ${trade.ticket}` },
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, message: "Trade already exists", tradeId: existing.id });
    }

    const totalFees = Math.abs(trade.commission) + Math.abs(trade.swap) + Math.abs(trade.fee);

    const newTrade = await prisma.trade.create({
      data: {
        userId: resolvedUserId,
        date: new Date(trade.closeTime * 1000),
        symbol: trade.symbol,
        side: trade.type === 0 ? "LONG" : "SHORT",
        qty: trade.volume,
        entryPrice: trade.openPrice,
        exitPrice: trade.closePrice,
        fees: totalFees,
        notes: `MT5 Ticket: ${trade.ticket} | Server: ${account.server} | Account: ${account.login}${trade.comment ? ` | ${trade.comment}` : ""}`,
        strategy: "MT5 Auto Import",
        tags: ["mt5", "auto-import"].join(","),
      },
    });

    console.log("✅ MT5 Trade imported:", trade.ticket, trade.symbol);

    return NextResponse.json({
      success: true,
      tradeId: newTrade.id,
      message: "Trade imported successfully",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid trade data", details: error.errors }, { status: 400 });
    }
    console.error("❌ MT5 trade import error:", error);
    return NextResponse.json({ success: false, error: "Failed to import trade" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const connections = Array.from(activeConnections.values()).map(conn => ({
    appId: conn.appId,
    account: {
      login: conn.account.login,
      server: conn.account.server,
      currency: conn.account.currency,
      balance: conn.account.balance,
      equity: conn.account.equity,
    },
    lastHeartbeat: conn.lastHeartbeat,
    status: conn.status,
    isOnline: (Date.now() - conn.lastHeartbeat.getTime()) < 60000,
  }));

  return NextResponse.json({
    success: true,
    connections,
    totalConnections: connections.length,
    onlineConnections: connections.filter(c => c.isOnline).length,
  });
}
