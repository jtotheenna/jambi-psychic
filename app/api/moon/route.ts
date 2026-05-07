import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { getMoonData } from "@/lib/moon"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function buildMoonPrompt(moonData: ReturnType<typeof getMoonData>, question: string): string {
  const { phase, illumination, dayOfCycle, daysToFull, daysToNew, sunBearMoon } = moonData
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" })

  return `You are Galileo — ancient oracle, reader of the sky and the wheel.

Today is ${dateStr}.

The person has come for a moon reading. You know the precise state of the sky right now:

CURRENT MOON:
- Phase: ${phase} (${illumination}% illuminated, day ${dayOfCycle} of the lunar cycle)
- ${daysToFull !== null ? `${daysToFull} days until Full Moon` : `${daysToNew} days until New Moon`}
- Sun Bear Moon: ${sunBearMoon.name}
- Totem: ${sunBearMoon.totem}
- Element: ${sunBearMoon.element}
- Clan: ${sunBearMoon.clan}
- Path: ${sunBearMoon.path}
- Moon energy: ${sunBearMoon.energy}

This reading draws from Sun Bear's Medicine Wheel Earth Astrology — a sacred system honoring the 13 moons and the four paths of the wheel.

Read for this person with warmth and precision. Speak to:
- What the current moon phase means for where they are right now
- The medicine of ${sunBearMoon.name} and its totem ${sunBearMoon.totem}
- How the ${sunBearMoon.path} speaks to their question
- What this specific moment in the lunar cycle asks of them

Their question: "${question}"

Do NOT use stage directions or asterisks. Speak directly. 3-4 paragraphs. Specific, not generic. Leave them with something real to carry.`
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
      data: { userId: session.user.id, type: "moon", status: "active", exchangesTotal: 5 },
    })
  }

  if (!moonSession) return Response.json({ error: "Purchase a moon reading first" }, { status: 403 })
  if (moonSession.exchangesUsed >= moonSession.exchangesTotal) {
    return Response.json({ error: "Reading complete" }, { status: 403 })
  }

  const moonData = getMoonData(new Date())
  const transcript = moonSession.transcript ? JSON.parse(moonSession.transcript) : []
  const isOpening = transcript.length === 0

  // Build message history
  const messages: Anthropic.MessageParam[] = []
  for (const msg of transcript) {
    messages.push({ role: msg.role === "galileo" ? "assistant" : "user", content: msg.content })
  }

  const systemPrompt = isOpening
    ? buildMoonPrompt(moonData, message)
    : `You are Galileo, continuing a moon reading.
Current moon: ${moonData.phase}, ${moonData.illumination}% illuminated.
Sun Bear Moon: ${moonData.sunBearMoon.name} — totem ${moonData.sunBearMoon.totem}.
Continue the conversation warmly and directly. 2-3 paragraphs max. No stage directions.`

  messages.push({ role: "user", content: message })

  const resp = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
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
