import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

function doRedirect(type: string, id: string) {
  if (type !== "tarot") redirect(`/${type}`)
  else redirect(`/reading/${id}`)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const shouldRedirect = searchParams.get("redirect") === "1"

  const session = await auth()
  if (!session?.user) {
    if (shouldRedirect) redirect("/dashboard")
    return Response.json({})
  }

  const reading = await prisma.readingSession.findFirst({
    where: { userId: session.user.id, status: "active" },
    orderBy: { createdAt: "desc" },
  })

  if (reading) {
    if (shouldRedirect) doRedirect(reading.type, reading.id)
    return Response.json({ sessionId: reading.id, type: reading.type })
  }

  // Fallback: find most recent purchase for this user and get its reading
  const purchase = await prisma.purchase.findFirst({
    where: { userId: session.user.id, status: "paid" },
    orderBy: { createdAt: "desc" },
    include: { session: true },
  })

  if (purchase?.session) {
    if (shouldRedirect) doRedirect(purchase.session.type, purchase.session.id)
    return Response.json({ sessionId: purchase.session.id, type: purchase.session.type })
  }

  if (shouldRedirect) redirect("/dashboard")
  return Response.json({})
}
