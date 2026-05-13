import { NextRequest } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { EXCHANGES } from "@/lib/stripe"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 })
  }

  // ── Payment link checkout ────────────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    // client_reference_id format: "{userId}--{type}"
    const ref = session.client_reference_id
    if (!ref) return Response.json({ ok: true })

    const [userId, type] = ref.split("--")
    if (!userId || !type) return Response.json({ ok: true })

    const amountCents = session.amount_total ?? 0

    // Guest checkout — create or find account from Stripe email
    let resolvedUserId = userId
    if (userId === "guest") {
      const email = session.customer_details?.email?.toLowerCase()
      if (!email) return Response.json({ ok: true })

      let user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        // Mark as guest with plain sentinel — activate route checks this before setting password
        user = await prisma.user.create({
          data: { email, name: session.customer_details?.name ?? null, passwordHash: "GUEST" },
        })
      }
      resolvedUserId = user.id
    }

    const purchase = await prisma.purchase.create({
      data: {
        userId: resolvedUserId,
        amountCents,
        stripePaymentIntentId: typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
        status: "paid",
      },
    })

    await prisma.readingSession.create({
      data: {
        userId: resolvedUserId,
        purchaseId: purchase.id,
        type,
        status: "active",
        exchangesTotal: EXCHANGES[type] ?? 1,
      },
    })
  }

  // ── Custom PaymentIntent (legacy tarot flow) ─────────────────────────────────
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
        exchangesTotal: EXCHANGES.tarot,
      },
    })
  }

  return Response.json({ ok: true })
}
