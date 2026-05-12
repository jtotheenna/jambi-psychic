import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Anthropic from "@anthropic-ai/sdk"

async function getInsights(data: string) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: `You are a growth analyst for a small AI psychic readings app called Galileo (askgalileo.live). Give sharp, specific, actionable insights. No fluff. What's working, what's leaking, what to do next. Plain language, short paragraphs.`,
    messages: [{ role: "user", content: `Analyze and advise:\n${data}` }],
  })
  return res.content[0].type === "text" ? res.content[0].text : ""
}

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user || session.user.email !== process.env.ADMIN_EMAIL) redirect("/dashboard")

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const week  = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const month = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalUsers, todayUsers, weekUsers,
    totalSessions, todaySessions, weekSessions,
    completedSessions, paidSessions,
    totalRevenueCents, weekRevenueCents,
    readingBreakdown, recentSessions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: week } } }),
    prisma.readingSession.count(),
    prisma.readingSession.count({ where: { createdAt: { gte: today } } }),
    prisma.readingSession.count({ where: { createdAt: { gte: week } } }),
    prisma.readingSession.count({ where: { status: "complete" } }),
    prisma.readingSession.count({ where: { purchaseId: { not: null } } }),
    prisma.purchase.aggregate({ where: { status: "paid" }, _sum: { amountCents: true } }),
    prisma.purchase.aggregate({ where: { status: "paid", createdAt: { gte: week } }, _sum: { amountCents: true } }),
    prisma.readingSession.groupBy({ by: ["type"], _count: true, orderBy: { _count: { type: "desc" } } }),
    prisma.readingSession.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
  ])

  const totalRevenue = (totalRevenueCents._sum.amountCents ?? 0) / 100
  const weekRevenue  = (weekRevenueCents._sum.amountCents ?? 0) / 100
  const conversionRate = totalUsers > 0 ? ((paidSessions / totalUsers) * 100).toFixed(1) : "0"
  const completionRate = totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(0) : "0"

  const dataForAI = `
GALILEO — askgalileo.live — AI psychic readings ($5–$15)

USERS: ${totalUsers} total | ${weekUsers} this week | ${todayUsers} today
SESSIONS: ${totalSessions} total | ${weekSessions} this week | ${todaySessions} today
REVENUE: $${totalRevenue.toFixed(2)} total | $${weekRevenue.toFixed(2)} this week
PAID SESSIONS: ${paidSessions} | FREE SESSIONS: ${totalSessions - paidSessions}
COMPLETION RATE: ${completionRate}% | CONVERSION: ${conversionRate}% of users paid

READINGS BY TYPE:
${readingBreakdown.map(r => `${r.type}: ${r._count} sessions`).join("\n")}
`

  const insights = await getInsights(dataForAI)

  const s = { fontFamily: "'Cinzel', serif" as const }
  const statCard = (label: string, value: string, sub?: string) => (
    <div style={{ padding: "20px 16px", borderRadius: 8, border: "1px solid rgba(42,26,85,0.6)", background: "rgba(10,5,32,0.6)" }}>
      <div style={{ ...s, fontSize: 7, letterSpacing: "0.2em", color: "#4a3870", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, color: "#c9a84c", fontWeight: "bold", marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ ...s, fontSize: 8, color: "#7a8ba8", letterSpacing: "0.1em" }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#04020e", color: "#ddd8f0", padding: "48px 32px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ ...s, fontSize: 22, color: "#c9a84c", letterSpacing: "0.15em" }}>GALILEO ANALYTICS</h1>
      </div>
      <div style={{ ...s, fontSize: 9, color: "#4a3870", letterSpacing: "0.2em", marginBottom: 40 }}>
        ASKGALILEO.LIVE · {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}
      </div>

      {/* Key metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 40 }}>
        {statCard("TOTAL USERS", totalUsers.toString(), `+${weekUsers} this week`)}
        {statCard("TODAY'S USERS", todayUsers.toString())}
        {statCard("TOTAL REVENUE", `$${totalRevenue.toFixed(2)}`, `$${weekRevenue.toFixed(2)} this week`)}
        {statCard("PAID SESSIONS", paidSessions.toString(), `${conversionRate}% of users`)}
        {statCard("TOTAL SESSIONS", totalSessions.toString(), `${weekSessions} this week`)}
        {statCard("COMPLETION", `${completionRate}%`, "finished readings")}
      </div>

      {/* AI Insights */}
      <div style={{ marginBottom: 40, padding: "28px 32px", borderRadius: 10, border: "1px solid rgba(124,58,237,0.3)", background: "linear-gradient(135deg, rgba(26,13,63,0.9), rgba(10,5,32,0.95))" }}>
        <div style={{ ...s, fontSize: 9, letterSpacing: "0.2em", color: "#a5b4fc", marginBottom: 20 }}>✦ AI ANALYSIS</div>
        <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.9, color: "#ddd8f0", whiteSpace: "pre-wrap" }}>
          {insights}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        {/* Reading breakdown */}
        <div>
          <div style={{ ...s, fontSize: 9, letterSpacing: "0.2em", color: "#4a3870", marginBottom: 16 }}>READINGS BY TYPE</div>
          {readingBreakdown.map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(42,26,85,0.3)" }}>
              <span style={{ ...s, fontSize: 9, letterSpacing: "0.1em", color: "#8878a8", textTransform: "uppercase" }}>{r.type}</span>
              <span style={{ color: "#c9a84c", fontWeight: "bold" }}>{r._count}</span>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div>
          <div style={{ ...s, fontSize: 9, letterSpacing: "0.2em", color: "#4a3870", marginBottom: 16 }}>RECENT SESSIONS</div>
          {recentSessions.map((s2, i) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid rgba(42,26,85,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ ...s, fontSize: 9, letterSpacing: "0.1em", color: s2.purchaseId ? "#a5b4fc" : "#4a3870", textTransform: "uppercase" }}>
                  {s2.type} {s2.purchaseId ? "· PAID" : ""}
                </span>
                <span style={{ fontSize: 11, color: "#4a3870" }}>
                  {new Date(s2.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#7a8ba8" }}>{s2.user.name || s2.user.email.split("@")[0]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
