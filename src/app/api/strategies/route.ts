import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name:        z.string().min(1),
  description: z.string().optional(),
  rules:       z.string().optional(),
  tags:        z.string().optional(),
});

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id ?? null;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const strategies = await prisma.strategy.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(strategies);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Validasyon hatası" }, { status: 400 });

    const strategy = await prisma.strategy.create({
      data: { ...parsed.data, userId },
    });
    return NextResponse.json(strategy, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
