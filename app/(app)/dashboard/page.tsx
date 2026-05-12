import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { buildPaymentUrl, getPaymentLink } from "@/lib/stripe"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      details: true,
      sessions: { orderBy: { createdAt: "desc" }, take: 20, include: { purchase: true } },
    },
  })
  if (!user) redirect("/login")

  const active = (type: string) => user.sessions.find(s => s.status === "active" && s.type === type)
  const activeTarot      = active("tarot")
  const activePalm       = active("palm")
  const activeMoon       = active("moon")
  const activeCartomancy = active("cartomancy")
  const activeLove       = active("love")
  const pastAstrology    = user.sessions.filter(s => s.type === "astrology" && s.status === "complete")
  const completedSessions = user.sessions.filter(s => s.status === "complete")

  const card = (
    icon: string, label: string, color: string, border: string,
    desc: string, meta: string, action: React.ReactNode, activeSession?: { id: string; question?: string | null; exchangesTotal: number; exchangesUsed: number } | null,
    returnHref?: string, abandonAction?: React.ReactNode
  ) => (
    <div style={{ padding: "20px 22px", borderRadius: 10, border: `1px solid ${activeSession ? color.replace("0.3", "0.4") : border}`, background: activeSession ? `linear-gradient(135deg, ${color.replace("0.3", "0.08")}, rgba(10,5,32,0.6))` : "rgba(10,5,32,0.5)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: activeSession ? "#a5b4fc" : color, marginBottom: 6 }}>{icon} {label}</div>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#c8d4e8", fontStyle: "italic", marginBottom: 4, lineHeight: 1.5 }}>
            {activeSession?.question ? `"${activeSession.question.substring(0, 65)}${activeSession.question.length > 65 ? "…" : ""}"` : desc}
          </p>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#7a8ba8", letterSpacing: "0.1em" }}>
            {activeSession ? `${activeSession.exchangesTotal - activeSession.exchangesUsed} EXCHANGES REMAINING` : meta}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
          {activeSession ? (
            <>
              <Link href={returnHref ?? "#"} style={{ padding: "9px 20px", borderRadius: 7, border: `1px solid ${color.replace("0.3","0.4")}`, background: color.replace("0.3","0.1"), color: "#ddd8f0", fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em", textDecoration: "none", whiteSpace: "nowrap" }}>RETURN ✦</Link>
              {abandonAction}
            </>
          ) : action}
        </div>
      </div>
    </div>
  )

  const beginBtn = (color: string, border: string) => (
    <button type="submit" style={{ padding: "9px 20px", borderRadius: 7, border: `1px solid ${border}`, background: `linear-gradient(135deg, ${color.replace("0.3","0.1")}, rgba(79,70,229,0.1))`, color: color.replace(/rgba\([^,]+,[^,]+,[^,]+,/, "rgba(").replace(/[\d.]+\)$/, "1)"), fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em", cursor: "pointer", whiteSpace: "nowrap" }}>BEGIN ✦</button>
  )

  const isAdmin = user!.email?.toLowerCase().trim() === (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim()

  const linkStyle = (color: string, border: string): React.CSSProperties => ({
    padding: "9px 20px", borderRadius: 7, border: `1px solid ${border}`,
    background: `linear-gradient(135deg, ${color.replace("0.3","0.1")}, rgba(79,70,229,0.1))`,
    color: color.replace(/rgba\([^,]+,[^,]+,[^,]+,/, "rgba(").replace(/[\d.]+\)$/, "1)"),
    fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em",
    cursor: "pointer", whiteSpace: "nowrap" as const, textDecoration: "none",
  })

  // Admin gets free access; everyone else goes through Stripe.
  // freeAction is the form/link shown to admin (and as fallback if no Stripe link).
  const payBtn = (type: string, color: string, border: string, freeAction: React.ReactNode) => {
    if (isAdmin) return freeAction
    const link = buildPaymentUrl(type, user!.id, user!.email)
    if (!link) return freeAction
    return <a href={link} style={linkStyle(color, border)}>BEGIN ✦</a>
  }

  const abandonBtn = (id: string) => (
    <form action={async () => { "use server"; await prisma.readingSession.update({ where: { id }, data: { status: "complete", completedAt: new Date() } }); redirect("/dashboard") }}>
      <button type="submit" style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: "#4a3870", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>abandon</button>
    </form>
  )

  const sectionHeader = (title: string, subtitle: string) => (
    <div style={{ marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid rgba(42,26,85,0.5)" }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.28em", color: "#c9a84c", marginBottom: 2 }}>{title}</div>
      <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#4a3870", fontStyle: "italic" }}>{subtitle}</div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", padding: "36px 20px", maxWidth: 780, margin: "0 auto", position: "relative", zIndex: 1 }}>

      {/* Header */}
      <div style={{ marginBottom: 44, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 20, letterSpacing: "0.1em" }} className="text-shimmer">GALILEO</h1>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.25em", color: "#a5b4fc", marginTop: 2 }}>
            {user.name ? `WELCOME BACK, ${user.name.toUpperCase()}` : "YOUR READINGS"}
          </div>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#4a3870", background: "none", border: "none", cursor: "pointer" }}>LEAVE ✦</button>
        </form>
      </div>

      {/* ── THE CARDS ── */}
      <div style={{ marginBottom: 40 }}>
        {sectionHeader("THE CARDS", "Drawn, shuffled, and read aloud.")}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {card("★", "TAROT READING", "rgba(201,168,76,0.3)", "rgba(201,168,76,0.2)",
            "Any question. A fully shuffled 78-card deck. He reads every card aloud.",
            "$15 · SPOKEN ALOUD",
            activeTarot
              ? <form action={async () => { "use server"; const s = await auth(); if (!s?.user) return; const r = await prisma.readingSession.create({ data: { userId: s.user.id, type: "tarot", status: "active", exchangesTotal: 5 } }); redirect(`/reading/${r.id}`) }}>{beginBtn("rgba(201,168,76,0.3)", "rgba(201,168,76,0.4)")}</form>
              : payBtn("tarot", "rgba(201,168,76,0.3)", "rgba(201,168,76,0.4)", <form action={async () => { "use server"; const s = await auth(); if (!s?.user) return; const r = await prisma.readingSession.create({ data: { userId: s.user.id, type: "tarot", status: "active", exchangesTotal: 5 } }); redirect(`/reading/${r.id}`) }}>{beginBtn("rgba(201,168,76,0.3)", "rgba(201,168,76,0.4)")}</form>),
            activeTarot, activeTarot ? `/reading/${activeTarot.id}` : undefined, activeTarot ? abandonBtn(activeTarot.id) : undefined
          )}

          {card("♠", "CARTOMANCY", "rgba(232,121,160,0.3)", "rgba(232,121,160,0.2)",
            "The old language of playing cards. Direct, sharp, and strangely accurate.",
            "$15 · SPOKEN ALOUD",
            activeCartomancy
              ? <form action={async () => { "use server"; const s = await auth(); if (!s?.user) return; await prisma.readingSession.create({ data: { userId: s.user.id, type: "cartomancy", status: "active", exchangesTotal: 5 } }); redirect("/cartomancy") }}>{beginBtn("rgba(232,121,160,0.3)", "rgba(232,121,160,0.4)")}</form>
              : payBtn("cartomancy", "rgba(232,121,160,0.3)", "rgba(232,121,160,0.4)", <form action={async () => { "use server"; const s = await auth(); if (!s?.user) return; await prisma.readingSession.create({ data: { userId: s.user.id, type: "cartomancy", status: "active", exchangesTotal: 5 } }); redirect("/cartomancy") }}>{beginBtn("rgba(232,121,160,0.3)", "rgba(232,121,160,0.4)")}</form>),
            activeCartomancy, "/cartomancy", activeCartomancy ? abandonBtn(activeCartomancy.id) : undefined
          )}

          {card("◎", "YES OR NO ORACLE", "rgba(165,180,252,0.3)", "rgba(165,180,252,0.2)",
            "One question. One clear answer. Yes, no, perhaps, not yet.",
            "$5 · SHORT SPOKEN READING",
            payBtn("yes-no", "rgba(165,180,252,0.3)", "rgba(165,180,252,0.4)", <a href="/yes-no" style={linkStyle("rgba(165,180,252,0.3)", "rgba(165,180,252,0.4)")}>BEGIN ✦</a>)
          )}
        </div>
      </div>

      {/* ── THE SKY ── */}
      <div style={{ marginBottom: 40 }}>
        {sectionHeader("THE SKY", "Planetary positions, lunar cycles, and the map of your birth.")}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {card("☽", "MOON READING", "rgba(165,180,252,0.3)", "rgba(165,180,252,0.2)",
            "The live moon phase, read through the Medicine Wheel. The sky is already set.",
            "$7 · ONE COMPLETE READING · SPOKEN ALOUD",
            payBtn("moon", "rgba(165,180,252,0.3)", "rgba(165,180,252,0.4)", <form action={async () => { "use server"; const s = await auth(); if (!s?.user) return; await prisma.readingSession.create({ data: { userId: s.user.id, type: "moon", status: "active", exchangesTotal: 1 } }); redirect("/moon") }}>{beginBtn("rgba(165,180,252,0.3)", "rgba(165,180,252,0.4)")}</form>)
          )}

          <div style={{ padding: "20px 22px", borderRadius: 10, border: "1px solid rgba(251,191,36,0.2)", background: "rgba(10,5,32,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#fbbf24", marginBottom: 6 }}>✦ NATAL CHART READING</div>
                <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#c8d4e8", fontStyle: "italic", marginBottom: 4, lineHeight: 1.5 }}>
                  Every planet. Every house. Every aspect. Your complete birth chart, spoken aloud.
                </p>
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#7a8ba8", letterSpacing: "0.1em" }}>
                  $10 · ONE-TIME FULL CHART · SPOKEN ALOUD{pastAstrology.length > 0 ? ` · ${pastAstrology.length} ALREADY READ` : ""}
                </p>
              </div>
              {payBtn("astrology", "rgba(251,191,36,0.3)", "rgba(251,191,36,0.4)", <a href="/astrology" style={linkStyle("rgba(251,191,36,0.3)", "rgba(251,191,36,0.4)")}>BEGIN ✦</a>)}
            </div>
          </div>
        </div>
      </div>

      {/* ── THE BODY ── */}
      <div style={{ marginBottom: 40 }}>
        {sectionHeader("THE BODY", "What the physical carries that the mind doesn't say.")}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {card("✋", "PALM READING", "rgba(200,212,232,0.25)", "rgba(200,212,232,0.2)",
            "Upload a photo of your palm. Galileo reads your lines, mounts, and soul — spoken aloud.",
            "$7 · FULL HAND READING · SPOKEN ALOUD",
            activePalm
              ? <form action={async () => { "use server"; const s = await auth(); if (!s?.user) return; await prisma.readingSession.create({ data: { userId: s.user.id, type: "palm", status: "active", exchangesTotal: 1 } }); redirect("/palm") }}>{beginBtn("rgba(200,212,232,0.25)", "rgba(200,212,232,0.35)")}</form>
              : payBtn("palm", "rgba(200,212,232,0.25)", "rgba(200,212,232,0.35)", <form action={async () => { "use server"; const s = await auth(); if (!s?.user) return; await prisma.readingSession.create({ data: { userId: s.user.id, type: "palm", status: "active", exchangesTotal: 1 } }); redirect("/palm") }}>{beginBtn("rgba(200,212,232,0.25)", "rgba(200,212,232,0.35)")}</form>),
            activePalm, "/palm", activePalm ? abandonBtn(activePalm.id) : undefined
          )}

          {card("🌈", "AURA PHOTO READING", "rgba(129,140,248,0.3)", "rgba(129,140,248,0.2)",
            "Upload a photo. Galileo reads the actual colors detected in your field — spoken aloud.",
            "$7 · FULL AURA READING · SPOKEN ALOUD",
            payBtn("aura", "rgba(129,140,248,0.3)", "rgba(129,140,248,0.4)", <a href="/aura" style={linkStyle("rgba(129,140,248,0.3)", "rgba(129,140,248,0.4)")}>BEGIN ✦</a>)
          )}
        </div>
      </div>

      {/* ── THE VEIL ── */}
      <div style={{ marginBottom: 40 }}>
        {sectionHeader("THE VEIL", "What is hidden, approaching, or asking to be seen.")}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {card("☁", "DREAM INTERPRETATION", "rgba(165,180,252,0.3)", "rgba(165,180,252,0.2)",
            "Describe your dream. Galileo reads the symbols, the emotion, and what lies beneath it.",
            "$7 · ONE COMPLETE READING · SPOKEN ALOUD",
            payBtn("dream", "rgba(165,180,252,0.3)", "rgba(165,180,252,0.4)", <a href="/dream" style={linkStyle("rgba(165,180,252,0.3)", "rgba(165,180,252,0.4)")}>BEGIN ✦</a>)
          )}

          {card("🕯", "GUIDE MESSAGE", "rgba(167,139,250,0.3)", "rgba(167,139,250,0.2)",
            "No question needed. Receive a message for your current moment.",
            "$5 · SHORT ORACLE READING · SPOKEN ALOUD",
            payBtn("guide", "rgba(167,139,250,0.3)", "rgba(167,139,250,0.4)", <a href="/guide" style={linkStyle("rgba(167,139,250,0.3)", "rgba(167,139,250,0.4)")}>BEGIN ✦</a>)
          )}
        </div>
      </div>

      {/* ── THE HEART ── */}
      <div style={{ marginBottom: 48 }}>
        {sectionHeader("THE HEART", "For love, connection, longing, and the truth beneath relationships.")}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {card("♡", "LOVE ORACLE", "rgba(232,121,160,0.3)", "rgba(232,121,160,0.2)",
            "Ask about a relationship, a person, or your own heart. He speaks what needs to be seen.",
            "$15 · SPOKEN ALOUD",
            activeLove
              ? <form action={async () => { "use server"; const s = await auth(); if (!s?.user) return; await prisma.readingSession.create({ data: { userId: s.user.id, type: "love", status: "active", exchangesTotal: 5 } }); redirect("/love") }}>{beginBtn("rgba(232,121,160,0.3)", "rgba(232,121,160,0.4)")}</form>
              : payBtn("love", "rgba(232,121,160,0.3)", "rgba(232,121,160,0.4)", <form action={async () => { "use server"; const s = await auth(); if (!s?.user) return; await prisma.readingSession.create({ data: { userId: s.user.id, type: "love", status: "active", exchangesTotal: 5 } }); redirect("/love") }}>{beginBtn("rgba(232,121,160,0.3)", "rgba(232,121,160,0.4)")}</form>),
            activeLove, "/love", activeLove ? abandonBtn(activeLove.id) : undefined
          )}
        </div>
      </div>

      {/* Past readings */}
      {completedSessions.length > 0 && (
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.25em", color: "#4a3870", marginBottom: 16 }}>PAST READINGS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {completedSessions.slice(0, 8).map(s => {
              const date = new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              const href = s.type === "tarot" ? `/reading/${s.id}` : `/${s.type}`
              return (
                <Link key={s.id} href={href} style={{ padding: "14px 18px", borderRadius: 8, border: "1px solid rgba(42,26,85,0.4)", background: "rgba(10,5,32,0.4)", textDecoration: "none", display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#ddd8f0", fontStyle: "italic", marginBottom: 2 }}>
                      {s.question ? `"${s.question.substring(0, 65)}${s.question.length > 65 ? "…" : ""}"` : `${s.type} reading`}
                    </div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: "#4a3870", letterSpacing: "0.12em" }}>
                      {date}{s.spread ? ` · ${s.spread}` : ""} · {s.type.toUpperCase()}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 56, textAlign: "center" }}>
        <Link href="/" style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#2a1a55", fontStyle: "italic", textDecoration: "none" }}>Return to the stars</Link>
      </div>
    </div>
  )
}
