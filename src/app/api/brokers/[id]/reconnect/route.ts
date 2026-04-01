import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existingBroker = await prisma.broker.findFirst({
      where: { id, userId }
    });

    if (!existingBroker) {
      return NextResponse.json({ error: "Broker bulunamadı" }, { status: 404 });
    }

    const broker = await prisma.broker.update({
      where: { id },
      data: { status: "connecting", lastSync: new Date() }
    });

    setTimeout(async () => {
      try {
        await prisma.broker.update({
          where: { id },
          data: { status: Math.random() > 0.5 ? "connected" : "error" }
        });
      } catch (error) {
        console.error("Error updating broker status:", error);
      }
    }, 3000);

    return NextResponse.json(broker);
  } catch (error) {
    console.error("Error reconnecting broker:", error);
    return NextResponse.json({ error: "Broker yeniden bağlanılamadı" }, { status: 500 });
  }
}
