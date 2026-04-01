import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const BrokerSchema = z.object({
  name:      z.string().min(1, "Broker adı gerekli"),
  platform:  z.enum(["MT5", "MT4", "cTrader", "NinjaTrader", "Binance", "Bybit"]),
  accountId: z.string().min(1, "Hesap numarası gerekli"),
  server:    z.string().optional(),
  username:  z.string().optional(),
  password:  z.string().optional(),
  apiKey:    z.string().optional(),
  apiSecret: z.string().optional(),
  currency:  z.string().default("USD"),
  leverage:  z.number().nullable().optional(),
  company:   z.string().optional(),
});

async function getUserId(req: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const brokers = await prisma.broker.findMany({
      where: { userId },
      include: { _count: { select: { trades: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(brokers);
  } catch (err) {
    return NextResponse.json({ error: "Broker listesi getirilemedi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = BrokerSchema.parse(await req.json());

    const existing = await prisma.broker.findFirst({
      where: { userId, accountId: data.accountId, platform: data.platform },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bu platform ve hesap numarası ile zaten bir broker kayıtlı" },
        { status: 400 }
      );
    }

    const broker = await prisma.broker.create({
      data: { userId, ...data, status: "disconnected" },
    });
    return NextResponse.json(broker, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz veri", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Broker oluşturulamadı" }, { status: 500 });
  }
}
