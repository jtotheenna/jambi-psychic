import { getStripe } from "@/lib/stripe"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("session")
  if (!sessionId) return Response.json({ error: "No session" }, { status: 400 })

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const email = session.customer_details?.email ?? null
    return Response.json({ email })
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
}
