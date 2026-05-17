import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { getStripe, EXCHANGES } from "@/lib/stripe"

export async function POST(req: Request) {
  const { email, password, firstName, stripeSessionId } = await req.json()
  if (!email || !password || password.length < 6) {
    return Response.json({ error: "Invalid input." }, { status: 400 })
  }

  let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  // Existing real account — don't overwrite password
  if (user && user.passwordHash !== "GUEST") {
    return Response.json({ existing: true }, { status: 200 })
  }

  const hash = await bcrypt.hash(password, 10)

  if (!user) {
    // No account yet (webhook may not have fired) — create it now
    user = await prisma.user.create({
      data: { email: email.toLowerCase(), name: firstName?.trim() || null, passwordHash: hash },
    })
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, name: firstName?.trim() || user.name || null },
    })
  }

  // If we have the Stripe session ID, ensure the reading session exists
  let readingType: string | null = null
  if (stripeSessionId) {
    try {
      const stripe = getStripe()
      const checkout = await stripe.checkout.sessions.retrieve(stripeSessionId)
      const ref = checkout.client_reference_id // "guest--{type}"
      const type = ref?.split("--")[1]
      if (type) {
        readingType = type
        const existing = await prisma.readingSession.findFirst({
          where: { userId: user.id, type, status: "active" },
        })
        if (!existing) {
          const purchase = await prisma.purchase.findFirst({
            where: { userId: user.id, status: "paid" },
            orderBy: { createdAt: "desc" },
          })
          await prisma.readingSession.create({
            data: {
              userId: user.id,
              purchaseId: purchase?.id ?? null,
              type,
              status: "active",
              exchangesTotal: EXCHANGES[type] ?? 1,
            },
          })
        }
      }
    } catch {}
  }

  return Response.json({ ok: true, readingType })
}
