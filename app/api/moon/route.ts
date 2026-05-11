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
        max_tokens: 1500,
        system: `You are Galileo — ancient oracle, keeper of Sun Bear's Medicine Wheel. No asterisks. No stage directions. No preamble. Begin reading immediately.

Tonight (${tonight}):
- ${moonData.phase}, ${moonData.illumination}% illuminated, day ${moonData.dayOfCycle} of the lunar cycle
- ${moonData.daysToFull !== null ? `${moonData.daysToFull} days to Full Moon` : `${moonData.daysToNew} days to New Moon`}
- Sun Bear Moon: ${sm.name} (${sm.dates})
- Totem animal: ${sm.totem}
- Element: ${sm.element} · Clan: ${sm.clan} · Path: ${sm.path}
- Moon energy this cycle: ${sm.energy}

Write 6 deep paragraphs. No list headers. Pure flowing prose:

1. THE PHASE — what this exact moment in the lunar cycle means. Not generic moon lore — what day ${moonData.dayOfCycle} at ${moonData.illumination}% specifically asks of a person. What the sky is doing right now and why it matters.

2. THE ${sm.name.toUpperCase()} — the full teaching of this moon in Sun Bear's wheel. What people born under this moon carry. What this moon's medicine is for everyone walking under it tonight. Be specific about what this moon asks, gives, and reveals.

3. THE ${sm.totem.toUpperCase()} — this totem as a living guide. How this animal actually moves through the world, what it sees, how it hunts or forages or sings. Then what that specific way of being is teaching right now.

4. THE ${sm.clan.toUpperCase()} CLAN — what it means to be held by this clan on the wheel. What the ${sm.clan} Clan knows, how it relates to the other clans, what its people are called to carry.

5. THE ${sm.path.toUpperCase()} AND ${sm.element.toUpperCase()} — what this path on the Medicine Wheel means and what the element of ${sm.element} brings to it tonight. How these two forces shape what a person can do or release under this specific combination.

6. THE CLOSING TRUTH — one true, specific thing to carry into tomorrow. Not a platitude. Something that only this moon, this totem, this path, this phase could have produced. Land it completely.${languageInstruction(language as Language)}`,
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
