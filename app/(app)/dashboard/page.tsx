import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import PayButton from "./PayButton"

const TAROT_LINK = process.env.STRIPE_TAROT_LINK!
const PALM_LINK  = process.env.STRIPE_PALM_LINK!
const MOON_LINK  = process.env.STRIPE_MOON_LINK!

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      details: true,
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { purchase: true },
      },
    },
  })

  if (!user) redirect("/login")

  const activeTarot = user.sessions.find((s) => s.status === "active" && s.type === "tarot")
  const activePalm  = user.sessions.find((s) => s.status === "active" && s.type === "palm")
  const activeMoon  = user.sessions.find((s) => s.status === "active" && s.type === "moon")
  const completedSessions = user.sessions.filter((s) => s.status === "complete")

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 24px",
        maxWidth: 800,
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 48, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1
            style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 22, letterSpacing: "0.1em" }}
            className="text-shimmer"
          >
            GALILEO
          </h1>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.25em", color: "#a5b4fc", marginTop: 2 }}>
            {user.name ? `WELCOME BACK, ${user.name.toUpperCase()}` : "YOUR READINGS"}
          </div>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "#4a3870",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            LEAVE ✦
          </button>
        </form>
      </div>

      {/* ── TAROT ── */}
      <div style={{ marginBottom: 20, padding: 24, borderRadius: 12, border: `1px solid ${activeTarot ? "rgba(165,180,252,0.4)" : "rgba(201,168,76,0.25)"}`, background: activeTarot ? "linear-gradient(135deg, rgba(79,70,229,0.1) 0%, rgba(10,5,32,0.6) 100%)" : "rgba(10,5,32,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: activeTarot ? "#a5b4fc" : "#c9a84c", marginBottom: 8 }}>
              ★ TAROT READING
            </div>
            {activeTarot ? (
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: "#c8d4e8", fontStyle: "italic", marginBottom: 4 }}>
                {activeTarot.question ? `"${activeTarot.question.substring(0, 70)}${activeTarot.question.length > 70 ? "..." : ""}"` : "Your reading is open."}
              </p>
            ) : (
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: "#c8d4e8", fontStyle: "italic", marginBottom: 4 }}>
                Any question. Any spread. He reads the cards and remembers you forever.
              </p>
            )}
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#7a8ba8", letterSpacing: "0.12em" }}>
              {activeTarot ? `${activeTarot.exchangesTotal - activeTarot.exchangesUsed} EXCHANGES REMAINING` : "$10 · UP TO 10 EXCHANGES · SPOKEN ALOUD"}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            {activeTarot ? (
              <>
                <Link href={`/reading/${activeTarot.id}`} style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(165,180,252,0.4)", background: "rgba(79,70,229,0.12)", color: "#a5b4fc", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.18em", textDecoration: "none", whiteSpace: "nowrap" }}>
                  RETURN ✦
                </Link>
                <form action={async () => { "use server"; await prisma.readingSession.update({ where: { id: activeTarot.id }, data: { status: "complete", completedAt: new Date() } }); redirect("/dashboard") }}>
                  <button type="submit" style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: "#4a3870", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>abandon</button>
                </form>
              </>
            ) : (
              <>
                <a href={`${TAROT_LINK}?client_reference_id=${user.id}--tarot`} style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.5)", background: "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(79,70,229,0.12) 100%)", color: "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.18em", textDecoration: "none", whiteSpace: "nowrap" }}>
                  BEGIN · $10
                </a>
                {process.env.NODE_ENV !== "production" && (
                  <form action={async () => { "use server"; const s = await auth(); if (!s?.user) return; const r = await prisma.readingSession.create({ data: { userId: s.user.id, type: "tarot", status: "active", exchangesTotal: 10 } }); redirect(`/reading/${r.id}`) }}>
                    <button type="submit" style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: "#4a3870", background: "none", border: "1px solid rgba(42,26,85,0.4)", borderRadius: 4, padding: "6px 12px", cursor: "pointer" }}>DEV: FREE TEST</button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── MOON ── */}
      <div style={{ marginBottom: 20, padding: 24, borderRadius: 12, border: `1px solid ${activeMoon ? "rgba(165,180,252,0.4)" : "rgba(165,180,252,0.2)"}`, background: "rgba(10,5,32,0.5)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#a5b4fc", marginBottom: 8 }}>☽ MOON READING</div>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: "#c8d4e8", fontStyle: "italic", marginBottom: 4 }}>
            {activeMoon ? "Your moon reading is open." : "Tonight's live moon phase and Sun Bear's Medicine Wheel. A full reading, spoken aloud."}
          </p>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#7a8ba8", letterSpacing: "0.12em" }}>
            {activeMoon ? `${activeMoon.exchangesTotal - activeMoon.exchangesUsed} QUESTIONS REMAINING` : "$5 · FULL READING + 2 QUESTIONS · SPOKEN ALOUD"}
          </p>
        </div>
        <Link href="/moon" style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(165,180,252,0.4)", background: "rgba(165,180,252,0.08)", color: "#a5b4fc", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.18em", textDecoration: "none", whiteSpace: "nowrap" }}>
          {activeMoon ? "RETURN ✦" : "BEGIN ✦"}
        </Link>
      </div>

      {/* ── PALM ── */}
      <div style={{ marginBottom: 32, padding: 24, borderRadius: 12, border: `1px solid ${activePalm ? "rgba(201,168,76,0.4)" : "rgba(201,168,76,0.2)"}`, background: "rgba(10,5,32,0.5)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#c9a84c", marginBottom: 8 }}>✋ PALM READING</div>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: "#c8d4e8", fontStyle: "italic", marginBottom: 4 }}>
            {activePalm ? "Your palm reading is open." : "Galileo reads your hand intuitively — no photo needed. Deep, specific, spoken aloud."}
          </p>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#7a8ba8", letterSpacing: "0.12em" }}>
            {activePalm ? `${activePalm.exchangesTotal - activePalm.exchangesUsed} EXCHANGES REMAINING` : "$5 · 5 EXCHANGES · SPOKEN ALOUD"}
          </p>
        </div>
        <Link href="/palm" style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.08)", color: "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.18em", textDecoration: "none", whiteSpace: "nowrap" }}>
          {activePalm ? "RETURN ✦" : "BEGIN ✦"}
        </Link>
      </div>

      {/* Past readings */}
      {completedSessions.length > 0 && (
        <div>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 10,
              letterSpacing: "0.25em",
              color: "#7a8ba8",
              marginBottom: 20,
            }}
          >
            PAST READINGS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {completedSessions.map((s) => {
              const cards = s.cardsDrawn ? JSON.parse(s.cardsDrawn) : []
              const date = new Date(s.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
              return (
                <Link
                  key={s.id}
                  href={`/reading/${s.id}`}
                  style={{
                    padding: "18px 20px",
                    borderRadius: 8,
                    border: "1px solid rgba(42,26,85,0.5)",
                    background: "rgba(10,5,32,0.4)",
                    textDecoration: "none",
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: "#ddd8f0", fontStyle: "italic", marginBottom: 4 }}>
                      {s.question
                        ? `"${s.question.substring(0, 70)}${s.question.length > 70 ? "..." : ""}"`
                        : "A reading with Galileo"}
                    </div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#7a8ba8", letterSpacing: "0.12em", marginTop: 6 }}>
                      {date}
                      {s.spread ? ` · ${s.spread}` : ""}
                    </div>
                  </div>
                  {cards.length > 0 && (
                    <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#7a8ba8", fontStyle: "italic", textAlign: "right" }}>
                      {cards.slice(0, 3).join(", ")}{cards.length > 3 ? "..." : ""}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Back to landing */}
      <div style={{ marginTop: 60, textAlign: "center" }}>
        <Link href="/" style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#2a1a55", fontStyle: "italic", textDecoration: "none" }}>
          Return to the stars
        </Link>
      </div>
    </div>
  )
}
