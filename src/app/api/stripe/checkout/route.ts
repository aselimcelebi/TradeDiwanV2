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
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Zaten Pro ise
    if (user.plan === "pro") {
      return NextResponse.json({ error: "Zaten Pro planındasınız" }, { status: 400 });
    }

    // Stripe customer oluştur veya mevcut olanı kullan
    let customerId = (user as any).stripeCustomerId as string | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name:  user.name  ?? undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data:  { stripeCustomerId: customerId } as any,
      });
    }

    // Checkout session oluştur
    const checkoutSession = await stripe.checkout.sessions.create({
      customer:   customerId,
      mode:       "subscription",
      line_items: [
        {
          price:    process.env.STRIPE_PRO_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/?upgraded=true`,
      cancel_url:  `${process.env.NEXTAUTH_URL}/pricing?cancelled=true`,
      metadata:    { userId },
      subscription_data: {
        metadata: { userId },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Ödeme sayfası oluşturulamadı" }, { status: 500 });
  }
}
