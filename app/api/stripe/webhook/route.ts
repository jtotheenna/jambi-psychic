import { NextRequest } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { EXCHANGES_PER_READING } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 })
  }

  // ── Custom checkout (tarot PaymentIntent flow) ──────────────────────────────
  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object
    const purchaseId = intent.metadata?.purchaseId
    if (!purchaseId) return Response.json({ ok: true })

    const purchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: "paid" },
    })

    await prisma.readingSession.create({
      data: {
        userId: purchase.userId,
        purchaseId: purchase.id,
        type: "tarot",
        status: "active",
        exchangesTotal: EXCHANGES_PER_READING,
      },
    })
  }

  // ── Payment link checkouts (tarot, palm, moon) ──────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    // client_reference_id format: "{userId}--{type}"
    const ref = session.client_reference_id
    if (!ref) return Response.json({ ok: true })

    const [userId, type] = ref.split("--")
    if (!userId || !type) return Response.json({ ok: true })

    const amountCents = session.amount_total ?? 0

    // Record the purchase
    const purchase = await prisma.purchase.create({
      data: {
        userId,
        amountCents,
        stripePaymentIntentId: typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
        status: "paid",
      },
    })

    // Create the reading session for the right type
    await prisma.readingSession.create({
      data: {
        userId,
        purchaseId: purchase.id,
        type,
        status: "active",
        exchangesTotal: type === "tarot" ? EXCHANGES_PER_READING : type === "cartomancy" ? 5 : 5,
      },
    })
  }

  return Response.json({ ok: true })
}
