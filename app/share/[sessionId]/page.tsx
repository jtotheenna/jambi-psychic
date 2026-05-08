import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { TAROT_DECK } from "@/lib/tarot"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

function cardSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

type Message = {
  role: "user" | "galileo"
  content: string
  cards?: { name: string; position?: string; reversed?: boolean }[]
}

export async function generateMetadata({ params }: { params: Promise<{ sessionId: string }> }): Promise<Metadata> {
  const { sessionId } = await params
  const session = await prisma.readingSession.findFirst({
    where: { id: sessionId, status: "complete" },
    select: { question: true, spread: true, type: true },
  })
  if (!session) return { title: "Galileo — The Celestial Oracle" }
  return {
    title: `A ${session.type} reading with Galileo`,
    description: session.question ? `"${session.question.substring(0, 120)}"` : "A reading from Galileo, the celestial oracle.",
    openGraph: {
      title: `A reading with Galileo`,
      description: session.question ? `"${session.question}"` : "The celestial oracle speaks.",
      siteName: "Ask Galileo",
    },
  }
}

export default async function SharePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params

  const session = await prisma.readingSession.findFirst({
    where: { id: sessionId, status: "complete" },
    include: { user: { select: { name: true } } },
  })

  if (!session) notFound()

  const transcript: Message[] = session.transcript ? JSON.parse(session.transcript) : []
  const cardsDrawn: string[] = session.cardsDrawn ? JSON.parse(session.cardsDrawn) : []
  const uniqueCards = cardsDrawn.filter((v, i, a) => a.indexOf(v) === i)
  const date = session.completedAt
    ? new Date(session.completedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null

  const typeLabel = session.type === "tarot" ? "TAROT" : session.type === "palm" ? "PALM" : "MOON"
  const typeIcon = session.type === "tarot" ? "★" : session.type === "palm" ? "✋" : "☽"

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(42,26,85,0.5)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 16, letterSpacing: "0.1em", textDecoration: "none" }} className="text-shimmer">
          GALILEO
        </Link>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#4a3870" }}>
            {typeIcon} {session.spread ? session.spread.toUpperCase() : typeLabel + " READING"}
          </div>
          {date && (
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em", color: "#2a1a55", marginTop: 2 }}>
              {date}
            </div>
          )}
        </div>
        <Link href="/signup" style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em", color: "#c9a84c", textDecoration: "none", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 6, padding: "6px 12px" }}>
          GET YOUR READING ✦
        </Link>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>

        {/* Question */}
        {session.question && (
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#4a3870", marginBottom: 8 }}>
              THE QUESTION
            </div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 20, color: "#c8d4e8", fontStyle: "italic", lineHeight: 1.6 }}>
              "{session.question}"
            </p>
          </div>
        )}

        {/* Cards */}
        {uniqueCards.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#7a8ba8", marginBottom: 16, textAlign: "center" }}>
              THE CARDS
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              {transcript
                .filter((m) => m.role === "galileo" && m.cards?.length)
                .flatMap((m) => m.cards || [])
                .map((card, i) => {
                  const cardData = TAROT_DECK.find((c) => c.name === card.name)
                  if (!cardData) return null
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      {card.position && (
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.12em", color: "#4a3870", textTransform: "uppercase" }}>
                          {card.position}
                        </div>
                      )}
                      <div style={{ width: 80, height: 134, borderRadius: 6, overflow: "hidden", border: "1px solid rgba(201,168,76,0.3)", position: "relative", transform: card.reversed ? "rotate(180deg)" : "none" }}>
                        <Image src={`/cards/${cardSlug(card.name)}.jpg`} alt={card.name} fill style={{ objectFit: "cover" }} sizes="80px" />
                      </div>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: "#7a8ba8", textAlign: "center", maxWidth: 80 }}>
                        {card.name}
                        {card.reversed && <div style={{ fontSize: 7, color: "#be123c" }}>↻ reversed</div>}
                      </div>
                    </div>
                  )
                })
                .filter(Boolean)}
            </div>
          </div>
        )}

        {/* Transcript */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {transcript.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: msg.role === "galileo" ? "radial-gradient(circle, #1a0d3f, #0a0520)" : "rgba(42,26,85,0.6)", border: msg.role === "galileo" ? "1px solid rgba(165,180,252,0.4)" : "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                {msg.role === "galileo" ? "☽" : "✦"}
              </div>
              <div style={{ maxWidth: "80%" }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.15em", color: msg.role === "galileo" ? "#7a8ba8" : "#7a6230", marginBottom: 4, textAlign: msg.role === "user" ? "right" : "left" }}>
                  {msg.role === "galileo" ? "GALILEO" : "YOU"}
                </div>
                <div style={{ padding: "14px 18px", borderRadius: msg.role === "galileo" ? "4px 16px 16px 16px" : "16px 4px 16px 16px", background: msg.role === "galileo" ? "linear-gradient(135deg, rgba(26,13,63,0.9), rgba(10,5,32,0.9))" : "rgba(42,26,85,0.5)", border: msg.role === "galileo" ? "1px solid rgba(165,180,252,0.15)" : "1px solid rgba(201,168,76,0.15)", fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.8, color: "#ddd8f0" }}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 56, padding: 32, borderRadius: 12, border: "1px solid rgba(201,168,76,0.2)", background: "rgba(10,5,32,0.6)", textAlign: "center" }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 18, letterSpacing: "0.1em", marginBottom: 8 }} className="text-shimmer">
            GALILEO
          </div>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: "#7a8ba8", fontStyle: "italic", marginBottom: 20 }}>
            The celestial oracle is waiting for your question.
          </p>
          <Link href="/signup" style={{ padding: "12px 32px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.5)", background: "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(79,70,229,0.12) 100%)", color: "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.2em", textDecoration: "none" }}>
            BEGIN YOUR READING ✦
          </Link>
        </div>
      </div>
    </div>
  )
}
