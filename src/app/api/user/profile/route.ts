import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name:  z.string().min(2).max(80),
  email: z.string().email(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { id: true, name: true, email: true, plan: true, createdAt: true, image: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });

  const userId = (session.user as any).id as string;
  const { name, email } = parsed.data;

  // Email değişiyorsa başkası kullanıyor mu kontrol et
  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: userId } },
  });
  if (existing) return NextResponse.json({ error: "Bu email başka bir hesapta kullanılıyor" }, { status: 409 });

  const updated = await prisma.user.update({
    where: { id: userId },
    data:  { name, email },
    select: { id: true, name: true, email: true, plan: true },
  });

  return NextResponse.json(updated);
}
