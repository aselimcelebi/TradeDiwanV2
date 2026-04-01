import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const user   = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !(user as any).stripeCustomerId) {
      return NextResponse.json({ error: "Stripe müşterisi bulunamadı" }, { status: 404 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   (user as any).stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    return NextResponse.json({ error: "Portal açılamadı" }, { status: 500 });
  }
}
