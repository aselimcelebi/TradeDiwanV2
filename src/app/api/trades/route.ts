import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const tradeSchema = z.object({
  date:         z.string(),
  symbol:       z.string().min(1, "Symbol gerekli"),
  side:         z.enum(["LONG", "SHORT"]),
  qty:          z.number().positive(),
  entryPrice:   z.number().positive(),
  exitPrice:    z.number().positive(),
  fees:         z.number().nonnegative().default(0),
  risk:         z.number().positive().optional(),
  strategy:     z.string().optional(),
  notes:        z.string().optional(),
  tags:         z.string().optional(),
  imageUrl:     z.string().url().optional().or(z.literal("")),
  setupGrade:   z.enum(["A","B","C","D"]).optional(),
  emotionScore: z.number().min(1).max(5).optional(),
  brokerId:     z.string().optional(),
});

async function getUserId(req: NextRequest) {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const from     = searchParams.get("from");
    const to       = searchParams.get("to");
    const symbol   = searchParams.get("symbol");
    const strategy = searchParams.get("strategy");
    const side     = searchParams.get("side");
    const outcome  = searchParams.get("outcome");
    const brokerId = searchParams.get("brokerId");

    const where: any = { userId };
    if (brokerId) where.brokerId = brokerId;
    if (from || to) {
      where.date = {
        ...(from && { gte: new Date(from) }),
        ...(to   && { lte: new Date(to) }),
      };
    }
    if (symbol)   where.symbol   = { contains: symbol,   mode: "insensitive" };
    if (strategy) where.strategy = { contains: strategy, mode: "insensitive" };
    if (side && side !== "ALL") where.side = side;

    const trades = await prisma.trade.findMany({
      where,
      include: { broker: { select: { name: true, platform: true, accountId: true } } },
      orderBy: { date: "desc" },
    });

    let result = trades;
    if (outcome && outcome !== "ALL") {
      result = trades.filter(t => {
        const pnl = (t.exitPrice - t.entryPrice) * t.qty * (t.side === "LONG" ? 1 : -1) - t.fees;
        return outcome === "WIN" ? pnl > 0 : pnl <= 0;
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = tradeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Validasyon hatası", details: parsed.error.format() }, { status: 400 });
    }

    const trade = await prisma.trade.create({
      data: { ...parsed.data, date: new Date(parsed.data.date), userId, imageUrl: parsed.data.imageUrl || null },
    });
    return NextResponse.json(trade, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

    const parsed = tradeSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validasyon hatası" }, { status: 400 });
    }

    const trade = await prisma.trade.update({
      where: { id, userId },
      data: { ...parsed.data, date: new Date(parsed.data.date), imageUrl: parsed.data.imageUrl || null },
    });
    return NextResponse.json(trade);
  } catch (err) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

    await prisma.trade.delete({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
