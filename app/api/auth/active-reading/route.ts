import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

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

  if (!reading) {
    if (shouldRedirect) redirect("/dashboard")
    return Response.json({})
  }

  if (shouldRedirect) {
    if (reading.type !== "tarot") redirect(`/${reading.type}`)
    else redirect(`/reading/${reading.id}`)
  }

  return Response.json({ sessionId: reading.id, type: reading.type })
}
