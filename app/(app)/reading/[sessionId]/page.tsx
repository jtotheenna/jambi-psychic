import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import ReadingRoom from "./ReadingRoom"

export default async function ReadingPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { sessionId } = await params

  const reading = await prisma.readingSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    include: { user: { include: { details: true } } },
  })

  if (!reading) notFound()

  if (reading.status === "pending") redirect("/dashboard")

  const transcript = reading.transcript ? JSON.parse(reading.transcript) : []
  const cardsDrawn = reading.cardsDrawn ? JSON.parse(reading.cardsDrawn) : []

  return (
    <ReadingRoom
      sessionId={sessionId}
      userName={reading.user.name}
      initialTranscript={transcript}
      initialCardsDrawn={cardsDrawn}
      exchangesUsed={reading.exchangesUsed}
      exchangesTotal={reading.exchangesTotal}
      isComplete={reading.status === "complete"}
      spread={reading.spread}
    />
  )
}
