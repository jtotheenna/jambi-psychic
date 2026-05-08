import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import ReadingRoom from "./ReadingRoom"
import SavedReading from "./SavedReading"

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

  // Completed readings → clean saved view, no avatar, no voice
  if (reading.status === "complete") {
    return (
      <SavedReading
        sessionId={sessionId}
        transcript={transcript}
        cardsDrawn={cardsDrawn}
        spread={reading.spread}
        question={reading.question}
        completedAt={reading.completedAt}
        userName={reading.user.name}
      />
    )
  }

  // Active readings → full interactive room
  return (
    <ReadingRoom
      sessionId={sessionId}
      userName={reading.user.name}
      initialTranscript={transcript}
      initialCardsDrawn={cardsDrawn}
      exchangesUsed={reading.exchangesUsed}
      exchangesTotal={reading.exchangesTotal}
      isComplete={false}
      spread={reading.spread}
    />
  )
}
