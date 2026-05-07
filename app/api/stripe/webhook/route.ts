import { NextRequest } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { EXCHANGES_PER_READING } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")!

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object
    const purchaseId = intent.metadata?.purchaseId

    if (!purchaseId) return Response.json({ ok: true })

    // Mark purchase as paid
    const purchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: "paid" },
    })

    // Create the reading session
    await prisma.readingSession.create({
      data: {
        userId: purchase.userId,
        purchaseId: purchase.id,
        status: "active",
        exchangesTotal: EXCHANGES_PER_READING,
      },
    })
  }

  return Response.json({ ok: true })
}
