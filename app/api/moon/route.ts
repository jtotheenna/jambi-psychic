import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { getMoonData } from "@/lib/moon"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function buildMoonPrompt(moonData: ReturnType<typeof getMoonData>, question: string, isFirst = true): string {
  const { phase, illumination, dayOfCycle, daysToFull, daysToNew, sunBearMoon } = moonData
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" })

  return `You are Galileo — ancient oracle, reader of the sky and Sun Bear's Medicine Wheel. No asterisks. No stage directions. Just speak.

Today is ${dateStr}.

TONIGHT'S SKY — you know this precisely:
- ${phase}, ${illumination}% illuminated, day ${dayOfCycle} of the lunar cycle
- ${daysToFull !== null ? `${daysToFull} days until the Full Moon` : `${daysToNew} days until the New Moon`}
- Sun Bear Moon: ${sunBearMoon.name} (${sunBearMoon.dates})
- Totem: ${sunBearMoon.totem} · Element: ${sunBearMoon.element} · Clan: ${sunBearMoon.clan}
- Path: ${sunBearMoon.path}
- Moon energy this cycle: ${sunBearMoon.energy}

${isFirst ? `YOUR FIRST RESPONSE MUST BE LONG AND RICH — 4-6 paragraphs minimum. Go deep. Cover:
- What being on day ${dayOfCycle} of this lunar cycle means — not generic, but specific to this exact moment
- The medicine of ${sunBearMoon.name} and what the ${sunBearMoon.totem} totem carries
- What the ${sunBearMoon.path} is asking of this person right now
- How all of this speaks to what they've shared with you
- What this precise moment in the sky is an invitation for them to do, release, or begin
Then ask ONE question that opens the conversation deeper.` : `Continue — 2-4 paragraphs, rich but conversational. Follow their thread. Ask one question unless this is the final exchange.`}

Their message: "${question}"

Be specific. Be personal. Speak with authority and genuine care. This is real knowledge you carry.`
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { message, sessionId } = await req.json()
  if (!message?.trim()) return Response.json({ error: "No question provided" }, { status: 400 })

  // Find active moon session or create one (dev bypass)
  let moonSession = sessionId
    ? await prisma.readingSession.findFirst({
        where: { id: sessionId, userId: session.user.id, type: "moon", status: "active" },
      })
    : await prisma.readingSession.findFirst({
        where: { userId: session.user.id, type: "moon", status: "active" },
      })

  if (!moonSession && process.env.NODE_ENV !== "production") {
    moonSession = await prisma.readingSession.create({
      data: { userId: session.user.id, type: "moon", status: "active", exchangesTotal: 2 },
    })
  }

  if (!moonSession) return Response.json({ error: "Purchase a moon reading first" }, { status: 403 })
  if (moonSession.exchangesUsed >= moonSession.exchangesTotal) {
    return Response.json({ error: "Reading complete" }, { status: 403 })
  }

  const moonData = getMoonData(new Date())
  const transcript = moonSession.transcript ? JSON.parse(moonSession.transcript) : []
  const isOpening = transcript.length === 0

  // Full reading delivered immediately on open — free, not counted
  if (message === "__OPENING__") {
    const tonight = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" })
    const sm = moonData.sunBearMoon
    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1800,
      system: `You are Galileo — ancient oracle, reader of sky and Sun Bear's Medicine Wheel. No asterisks. No stage directions. Speak directly.

Tonight (${tonight}): ${moonData.phase}, ${moonData.illumination}% illuminated, day ${moonData.dayOfCycle} of the lunar cycle. ${moonData.daysToFull !== null ? `${moonData.daysToFull} days to Full Moon.` : `${moonData.daysToNew} days to New Moon.`}
Sun Bear Moon: ${sm.name} (${sm.dates}). Totem: ${sm.totem}. Element: ${sm.element}. Clan: ${sm.clan}. Path: ${sm.path}.
Moon energy: ${sm.energy}

Give the COMPLETE moon reading right now. No preamble, no asking what they want. They opened this to hear the sky — tell them everything.

Write 5-7 rich paragraphs covering ALL of this:
1. Tonight's exact phase — what it means to be on day ${moonData.dayOfCycle} at ${moonData.illumination}% illumination, the specific quality of light and energy right now
2. The ${sm.name} — its full teaching, what this moon carries in Sun Bear's system, what it has meant across time
3. The ${sm.totem} spirit — ${sm.totem} as guide, how this animal moves through the world, what it teaches about the current moment
4. The ${sm.path} — what this path on the wheel means, how it differs from the other paths, what it is asking of those walking it tonight
5. The ${sm.element} and ${sm.clan} — how these energies shape this moon and the people drawn to it
6. What tonight specifically asks — what to release, begin, sit with, or honor under this exact sky
7. A closing truth that ties phase + moon + path into one real thing they can carry

Be rich, specific, authoritative. This is their reading. Give them everything.`,
      messages: [{ role: "user", content: "Read the moon." }],
    })
    const reading = resp.content[0].type === "text" ? resp.content[0].text : ""
    return Response.json({
      reading,
      sessionId: moonSession.id,
      moonData: { phase: moonData.phase, illumination: moonData.illumination, dayOfCycle: moonData.dayOfCycle, phaseEmoji: moonData.phaseEmoji, sunBearMoon: moonData.sunBearMoon },
      exchangesUsed: moonSession.exchangesUsed,
      exchangesTotal: moonSession.exchangesTotal,
      isComplete: false,
      isGreeting: true,
    })
  }

  // Build message history
  const messages: Anthropic.MessageParam[] = []
  for (const msg of transcript) {
    messages.push({ role: msg.role === "galileo" ? "assistant" : "user", content: msg.content })
  }

  const systemPrompt = buildMoonPrompt(moonData, message, isOpening)

  messages.push({ role: "user", content: message })

  const resp = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: isOpening ? 1200 : 700,
    system: systemPrompt,
    messages,
  })

  const reading = resp.content[0].type === "text" ? resp.content[0].text : ""

  // Update session
  transcript.push({ role: "user", content: message })
  transcript.push({ role: "galileo", content: reading })

  const newExchangesUsed = moonSession.exchangesUsed + 1
  const isComplete = newExchangesUsed >= moonSession.exchangesTotal

  await prisma.readingSession.update({
    where: { id: moonSession.id },
    data: {
      transcript: JSON.stringify(transcript),
      question: moonSession.question || message,
      exchangesUsed: newExchangesUsed,
      status: isComplete ? "complete" : "active",
      completedAt: isComplete ? new Date() : null,
    },
  })

  return Response.json({
    reading,
    sessionId: moonSession.id,
    moonData: {
      phase: moonData.phase,
      illumination: moonData.illumination,
      dayOfCycle: moonData.dayOfCycle,
      phaseEmoji: moonData.phaseEmoji,
      sunBearMoon: moonData.sunBearMoon,
    },
    exchangesUsed: newExchangesUsed,
    exchangesTotal: moonSession.exchangesTotal,
    isComplete,
  })
}
