import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { stripe, READING_PRICE_CENTS } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: "Sign in to begin a reading" }, { status: 401 })
  }

  // Create a pending purchase record
  const purchase = await prisma.purchase.create({
    data: {
      userId: session.user.id,
      amountCents: READING_PRICE_CENTS,
      status: "pending",
    },
  })

  // Create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: READING_PRICE_CENTS,
    currency: "usd",
    metadata: {
      userId: session.user.id,
      purchaseId: purchase.id,
    },
  })

  // Attach the payment intent to the purchase
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  })

  return Response.json({
    clientSecret: paymentIntent.client_secret,
    purchaseId: purchase.id,
  })
}
