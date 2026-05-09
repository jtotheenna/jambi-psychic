import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 })
  }

  const session = await auth()
  if (!session?.user) return new Response("Unauthorized", { status: 401 })

  const reading = await prisma.readingSession.create({
    data: {
      userId: session.user.id,
      status: "active",
      exchangesTotal: 5,
    },
  })

  return Response.json({ id: reading.id })
}
