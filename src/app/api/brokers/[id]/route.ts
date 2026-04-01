import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id ?? null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const broker = await prisma.broker.findFirst({
      where: { id: params.id, userId },
      include: { _count: { select: { trades: true } } },
    });
    if (!broker) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    return NextResponse.json(broker);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const existing = await prisma.broker.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

    const broker = await prisma.broker.update({ where: { id: params.id }, data: body });
    return NextResponse.json(broker);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.broker.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

    await prisma.broker.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
