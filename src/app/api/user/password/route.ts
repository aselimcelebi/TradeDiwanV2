import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8),
});

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });

  const userId = (session.user as any).id as string;
  const user   = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  // Google OAuth kullanıcıları için şifre yoktur
  if (!user.password) {
    return NextResponse.json({ error: "Google ile giriş yapan hesaplarda şifre değiştirilemez" }, { status: 400 });
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!valid) return NextResponse.json({ error: "Mevcut şifre hatalı" }, { status: 400 });

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  return NextResponse.json({ success: true });
}
