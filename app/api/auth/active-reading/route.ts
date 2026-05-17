import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) return Response.json({})

  const reading = await prisma.readingSession.findFirst({
    where: { userId: session.user.id, status: "active" },
    orderBy: { createdAt: "desc" },
  })

  if (!reading) return Response.json({})
  return Response.json({ sessionId: reading.id, type: reading.type })
}
