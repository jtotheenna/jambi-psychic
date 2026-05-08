import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { getMoonData } from "@/lib/moon"
import { languageInstruction, type Language } from "@/lib/language"

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

  const { message, sessionId, language = "en" } = await req.json()
  if (!message?.trim()) return Response.json({ error: "No question provided" }, { status: 400 })

  // Find active moon session or create one (dev bypass)
  let moonSession = sessionId
    ? await prisma.readingSession.findFirst({
        where: { id: sessionId, userId: session.user.id, type: "moon", status: "active" },
      })
    : await prisma.readingSession.findFirst({
        where: { userId: session.user.id, type: "moon", status: "active" },
      })

  if (!moonSession) {
    // TESTING: free session for all — remove before launch
    moonSession = await prisma.readingSession.create({
      data: { userId: session.user.id, type: "moon", status: "active", exchangesTotal: 2 },
    })
  }
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
      max_tokens: 700,
      system: `You are Galileo — ancient oracle, reader of sky and Sun Bear's Medicine Wheel. No asterisks. No stage directions. Speak directly.

Tonight (${tonight}): ${moonData.phase}, ${moonData.illumination}% illuminated, day ${moonData.dayOfCycle} of the lunar cycle. ${moonData.daysToFull !== null ? `${moonData.daysToFull} days to Full Moon.` : `${moonData.daysToNew} days to New Moon.`}
Sun Bear Moon: ${sm.name} (${sm.dates}). Totem: ${sm.totem}. Element: ${sm.element}. Clan: ${sm.clan}. Path: ${sm.path}.
Moon energy: ${sm.energy}

Give the moon reading now. No preamble. 3-4 rich paragraphs covering:
1. Tonight's exact phase and what it asks of the person right now
2. The ${sm.name} and what the ${sm.totem} totem teaches for this moment
3. What the ${sm.path} and ${sm.element}/${sm.clan} energies mean tonight
4. One closing truth they can carry — what this precise sky is asking of them

Be specific, authoritative, personal. Then ask ONE question to open the conversation.${languageInstruction(language as Language)}`,
      messages: [{ role: "user", content: "Read the moon." }],
    })
    const reading = resp.content[0].type === "text" ? resp.content[0].text : ""

    const transcript = [{ role: "galileo", content: reading }]

    await prisma.readingSession.update({
      where: { id: moonSession.id },
      data: {
        status: "complete",
        completedAt: new Date(),
        question: "Moon reading",
        transcript: JSON.stringify(transcript),
      },
    })

    return Response.json({
      reading,
      sessionId: moonSession.id,
      moonData: { phase: moonData.phase, illumination: moonData.illumination, dayOfCycle: moonData.dayOfCycle, phaseEmoji: moonData.phaseEmoji, sunBearMoon: moonData.sunBearMoon },
      exchangesUsed: 1,
      exchangesTotal: 1,
      isComplete: true,
      isGreeting: true,
    })
  }

  // Build message history
  const messages: Anthropic.MessageParam[] = []
  for (const msg of transcript) {
    messages.push({ role: msg.role === "galileo" ? "assistant" : "user", content: msg.content })
  }

  const systemPrompt = buildMoonPrompt(moonData, message, isOpening) + languageInstruction(language as Language)

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
