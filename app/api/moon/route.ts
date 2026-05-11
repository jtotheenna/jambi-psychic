import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMoonData } from "@/lib/moon"
import { languageInstruction, type Language } from "@/lib/language"
import { sseResponse, streamClaude } from "@/lib/streamSSE"

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

  let moonSession = sessionId
    ? await prisma.readingSession.findFirst({ where: { id: sessionId, userId: session.user.id, type: "moon", status: "active" } })
    : await prisma.readingSession.findFirst({ where: { userId: session.user.id, type: "moon", status: "active" } })

  if (!moonSession) {
    moonSession = await prisma.readingSession.create({
      data: { userId: session.user.id, type: "moon", status: "active", exchangesTotal: 2 },
    })
  }
  if (moonSession.exchangesUsed >= moonSession.exchangesTotal) {
    return Response.json({ error: "Reading complete" }, { status: 403 })
  }

  const moonData = getMoonData(new Date())
  const moonMeta = { phase: moonData.phase, illumination: moonData.illumination, dayOfCycle: moonData.dayOfCycle, phaseEmoji: moonData.phaseEmoji, sunBearMoon: moonData.sunBearMoon }

  // __OPENING__ — full reading streamed immediately
  if (message === "__OPENING__") {
    const tonight = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" })
    const sm = moonData.sunBearMoon
    const sessionId = moonSession.id

    return sseResponse(async (emit) => {
      emit("moon", { moonData: moonMeta })

      const reading = await streamClaude(emit, {
        model: "claude-sonnet-4-6",
        max_tokens: 1800,
        system: `You are Galileo — ancient oracle, reader of sky and Sun Bear's Medicine Wheel. No asterisks. No stage directions. Speak directly.

Tonight (${tonight}): ${moonData.phase}, ${moonData.illumination}% illuminated, day ${moonData.dayOfCycle} of the lunar cycle. ${moonData.daysToFull !== null ? `${moonData.daysToFull} days to Full Moon.` : `${moonData.daysToNew} days to New Moon.`}
Sun Bear Moon: ${sm.name} (${sm.dates}). Totem: ${sm.totem}. Element: ${sm.element}. Clan: ${sm.clan}. Path: ${sm.path}.
Moon energy: ${sm.energy}

Give the COMPLETE moon reading right now. No preamble. No question at the end — this is a single complete reading.

Write 6-8 rich paragraphs covering ALL of this in depth:
1. Tonight's exact phase — what it means to be at ${moonData.illumination}% on day ${moonData.dayOfCycle}
2. The ${sm.name} — its full teaching, what this moon carries
3. The ${sm.totem} spirit — as guide, how this animal moves through the world
4. The ${sm.path} — what this path on the wheel means tonight
5. The ${sm.element} and ${sm.clan} — how these energies shape this moon
6. What tonight specifically asks — what to release, begin, sit with, or honor
7. A closing truth that ties phase + moon + totem + path into one real thing they can carry

Be rich. Be long. Be specific. Give them everything.${languageInstruction(language as Language)}`,
        messages: [{ role: "user", content: "Read the moon." }],
      })

      await prisma.readingSession.update({
        where: { id: sessionId },
        data: { status: "complete", completedAt: new Date(), question: "Moon reading", transcript: JSON.stringify([{ role: "galileo", content: reading }]), exchangesUsed: 1 },
      })

      emit("done", { reading, sessionId, moonData: moonMeta, exchangesUsed: 1, exchangesTotal: 1, isComplete: true })
    })
  }

  // Follow-up messages
  const transcript = moonSession.transcript ? JSON.parse(moonSession.transcript) : []
  const isOpening = transcript.length === 0
  const messages: { role: "user" | "assistant"; content: string }[] = []
  for (const msg of transcript) {
    messages.push({ role: msg.role === "galileo" ? "assistant" : "user", content: msg.content })
  }
  messages.push({ role: "user", content: message })

  const systemPrompt = buildMoonPrompt(moonData, message, isOpening) + languageInstruction(language as Language)
  const sessionRef = moonSession
  const newExchangesUsed = moonSession.exchangesUsed + 1
  const isComplete = newExchangesUsed >= moonSession.exchangesTotal

  return sseResponse(async (emit) => {
    const reading = await streamClaude(emit, {
      model: "claude-sonnet-4-6",
      max_tokens: isOpening ? 1200 : 700,
      system: systemPrompt,
      messages,
    })

    transcript.push({ role: "user", content: message })
    transcript.push({ role: "galileo", content: reading })

    await prisma.readingSession.update({
      where: { id: sessionRef.id },
      data: {
        transcript: JSON.stringify(transcript),
        question: sessionRef.question || message,
        exchangesUsed: newExchangesUsed,
        status: isComplete ? "complete" : "active",
        completedAt: isComplete ? new Date() : null,
      },
    })

    emit("done", { reading, sessionId: sessionRef.id, moonData: moonMeta, exchangesUsed: newExchangesUsed, exchangesTotal: sessionRef.exchangesTotal, isComplete })
  })
}
