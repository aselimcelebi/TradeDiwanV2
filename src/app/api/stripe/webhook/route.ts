import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session    = event.data.object as Stripe.Checkout.Session;
        const userId     = session.metadata?.userId;
        const subId      = session.subscription as string;
        if (!userId) break;

        await prisma.user.update({
          where: { id: userId },
          data:  {
            plan: "pro",
            stripeSubscriptionId: subId,
          } as any,
        });
        console.log("✅ Pro plan activated for user:", userId);
        break;
      }

      case "customer.subscription.deleted": {
        const sub    = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        await prisma.user.update({
          where: { id: userId },
          data:  { plan: "free", stripeSubscriptionId: null } as any,
        });
        console.log("❌ Pro plan cancelled for user:", userId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId   = invoice.subscription as string;
        if (!subId) break;

        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subId } as any,
        });
        if (user) {
          console.warn("⚠️ Payment failed for user:", user.id);
          // İstersen email gönderebilirsin
        }
        break;
      }

      default:
        console.log("Unhandled Stripe event:", event.type);
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
