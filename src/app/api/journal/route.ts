import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  date:         z.string(),
  whatWentWell: z.string().optional(),
  toImprove:    z.string().optional(),
  mood:         z.number().int().min(1).max(5).optional(),
  notes:        z.string().optional(),
  tags:         z.string().optional(),
});

async function getUserId(req: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const date = new URL(req.url).searchParams.get("date");

    if (date) {
      const entry = await prisma.journalEntry.findUnique({
        where: { userId_date: { userId, date: new Date(date) } },
      });
      return NextResponse.json(entry);
    }

    const entries = await prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(entries);
  } catch (err) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Validasyon hatası" }, { status: 400 });

    const date = new Date(parsed.data.date);
    const entry = await prisma.journalEntry.upsert({
      where: { userId_date: { userId, date } },
      create: { ...parsed.data, date, userId },
      update: { ...parsed.data, date },
    });
    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...data } = body;
    const parsed = schema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: "Validasyon hatası" }, { status: 400 });

    const existing = await prisma.journalEntry.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });

    const entry = await prisma.journalEntry.update({
      where: { id },
      data: { ...parsed.data, date: new Date(parsed.data.date!) },
    });
    return NextResponse.json({ success: true, entry });
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

    const existing = await prisma.journalEntry.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });

    await prisma.journalEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
