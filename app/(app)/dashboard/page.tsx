import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import PayButton from "./PayButton"

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

  const activeSession = user.sessions.find((s) => s.status === "active")
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
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.25em", color: "#4a3870", marginTop: 2 }}>
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

      {/* Active session */}
      {activeSession && (
        <div
          style={{
            marginBottom: 32,
            padding: 24,
            borderRadius: 12,
            border: "1px solid rgba(165,180,252,0.3)",
            background: "linear-gradient(135deg, rgba(79,70,229,0.1) 0%, rgba(10,5,32,0.6) 100%)",
          }}
        >
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 10,
              letterSpacing: "0.2em",
              color: "#a5b4fc",
              marginBottom: 12,
            }}
          >
            READING IN PROGRESS
          </div>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#7a8ba8", fontStyle: "italic", marginBottom: 16 }}>
            {activeSession.question
              ? `"${activeSession.question.substring(0, 80)}${activeSession.question.length > 80 ? "..." : ""}"`
              : "Your reading is open."}
          </p>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <Link
              href={`/reading/${activeSession.id}`}
              style={{
                padding: "10px 28px",
                borderRadius: 8,
                border: "1px solid rgba(165,180,252,0.4)",
                background: "rgba(79,70,229,0.12)",
                color: "#a5b4fc",
                fontFamily: "'Cinzel', serif",
                fontSize: 10,
                letterSpacing: "0.18em",
                textDecoration: "none",
              }}
            >
              RETURN TO READING
            </Link>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#4a3870", letterSpacing: "0.1em" }}>
              {activeSession.exchangesTotal - activeSession.exchangesUsed} VISIONS REMAINING
            </span>
          </div>
        </div>
      )}

      {/* New reading */}
      {!activeSession && (
        <div
          style={{
            marginBottom: 40,
            padding: 32,
            borderRadius: 12,
            border: "1px solid rgba(201,168,76,0.25)",
            background: "rgba(10,5,32,0.5)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12, color: "#c8d4e8", textShadow: "0 0 20px rgba(200,212,232,0.4)" }}>☽</div>
          <div
            style={{ fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: "0.2em", color: "#c9a84c", marginBottom: 12 }}
          >
            BEGIN A NEW READING
          </div>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: "#7a8ba8", fontStyle: "italic", marginBottom: 24 }}>
            Ten visions. Any question. He is waiting.
          </p>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "#4a3870", letterSpacing: "0.15em", marginBottom: 24 }}>
            $10 · 10 EXCHANGES · REMEMBERED FOREVER
          </p>
          <PayButton />
          {process.env.NODE_ENV !== "production" && (
            <form
              action={async () => {
                "use server"
                const session = await auth()
                if (!session?.user) return
                const reading = await prisma.readingSession.create({
                  data: { userId: session.user.id, status: "active", exchangesTotal: 10 },
                })
                redirect(`/reading/${reading.id}`)
              }}
            >
              <button
                type="submit"
                style={{
                  marginTop: 12,
                  fontFamily: "'Cinzel', serif",
                  fontSize: 9,
                  letterSpacing: "0.15em",
                  color: "#4a3870",
                  background: "none",
                  border: "1px solid rgba(42,26,85,0.4)",
                  borderRadius: 6,
                  padding: "8px 20px",
                  cursor: "pointer",
                }}
              >
                DEV: TEST WITHOUT PAYING
              </button>
            </form>
          )}
        </div>
      )}

      {/* Past readings */}
      {completedSessions.length > 0 && (
        <div>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 10,
              letterSpacing: "0.25em",
              color: "#4a3870",
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
                    <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#8878a8", fontStyle: "italic", marginBottom: 4 }}>
                      {s.question
                        ? `"${s.question.substring(0, 70)}${s.question.length > 70 ? "..." : ""}"`
                        : "A reading with Galileo"}
                    </div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#4a3870", letterSpacing: "0.12em" }}>
                      {date}
                      {s.spread ? ` · ${s.spread}` : ""}
                    </div>
                  </div>
                  {cards.length > 0 && (
                    <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 13, color: "#4a3870", fontStyle: "italic" }}>
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
