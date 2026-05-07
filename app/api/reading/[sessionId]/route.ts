import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { sessionId } = await params

  const reading = await prisma.readingSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
  })

  if (!reading) return Response.json({ error: "Not found" }, { status: 404 })

  return Response.json(reading)
}
