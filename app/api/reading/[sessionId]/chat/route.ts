import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { TAROT_DECK, chooseSpreadsForConcern } from "@/lib/tarot"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

type DrawnCard = { name: string; position: string; reversed: boolean }

function shuffleDraw(count: number): Omit<DrawnCard, "position">[] {
  // Fisher-Yates shuffle of a fresh copy of the full 78-card deck
  const deck = [...TAROT_DECK]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  // ~1-in-3 cards land reversed, independently per card
  return deck.slice(0, count).map((card) => ({
    name: card.name,
    reversed: Math.random() < 0.33,
  }))
}

function buildSystemPrompt(
  userName: string | null,
  userDetails: { notes?: string | null; concerns?: string | null; birthDate?: string | null } | null,
  pastReadingSummary: string | null,
  exchangesLeft: number,
  preDrawnCards?: DrawnCard[],
  voiceMode = false
) {
  const memory = userDetails
    ? `
What you know about this person:
- Name: ${userName || "unknown"}
${userDetails.birthDate ? `- Birth date: ${userDetails.birthDate}` : ""}
${userDetails.notes ? `- Notes from past readings: ${userDetails.notes}` : ""}
${userDetails.concerns ? `- Recurring themes and concerns: ${userDetails.concerns}` : ""}
${pastReadingSummary ? `- What came up in their last reading: ${pastReadingSummary}` : ""}`.trim()
    : `- This person is new to you. Their name: ${userName || "unknown"}.`

  const cardSection = preDrawnCards
    ? `CARDS HAVE BEEN DRAWN. Your FIRST line of response must be exactly this (the UI needs it to display the cards):
CARDS_DRAWN: ${JSON.stringify(preDrawnCards)}

The cards drawn are:
${preDrawnCards.map((c, i) => `  ${i + 1}. ${c.position}: ${c.name}${c.reversed ? " (REVERSED)" : " (upright)"}`).join("\n")}

After that line, give your interpretation — brief, specific to this person.`
    : `Cards already dealt. Continue the conversation naturally. Do NOT request clarifying cards unless absolutely necessary — one per response maximum. If you need one, include exactly the text CLARIFYING_CARD_REQUESTED once. Never repeat it multiple times. Never mention waiting for cards from a server. Just read what you have.`

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" })

  return `You are Galileo — an ancient oracle who lives inside a moon box. Wry, warm, direct. You've seen every human problem a thousand times and you care anyway.

Today is ${dateStr}. You know this precisely.

NEVER use stage directions, narration, or action text like "*the light pulses*" or "*settling deeper*". No asterisks. No scene-setting. Just speak.

Do NOT open with lengthy mood-setting. Get to the point. Ask one question or make one observation — not five.

Your voice: dry wit, genuine warmth, total confidence. You don't perform mysticism. You just know things.

${voiceMode
  ? `VOICE MODE — spoken out loud. Maximum 2-3 sentences per response. Short, direct, conversational. Like a wise friend talking, not a monologue. If they want more, they'll ask.`
  : `Keep responses focused. 2-4 short paragraphs maximum. Don't over-explain. Leave space for them to respond.`
}

- ${cardSection}
- You do NOT choose cards. They are dealt for you. Read what was given.
- Call them by name occasionally. Not every sentence.
- Reference past readings naturally if you know them.
- Dry humor is fine: "The Tower. Naturally." — but always return to real insight.

${memory}

Exchanges remaining: ${exchangesLeft}.
${exchangesLeft <= 2 ? "Nearing the end. Begin closing — a final reflection for them to carry." : ""}
${exchangesLeft === 0 ? "Last exchange. Leave them with something real." : ""}`
}

type StoredMessage = {
  role: "user" | "galileo"
  content: string
  cards?: { name: string; position?: string; reversed?: boolean }[]
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { sessionId } = await params
  const { message, voiceMode = false } = await req.json()

  if (!message?.trim()) return Response.json({ error: "Message required" }, { status: 400 })

  const reading = await prisma.readingSession.findFirst({
    where: { id: sessionId, userId: session.user.id, status: "active" },
    include: { user: { include: { details: true } } },
  })

  if (!reading) return Response.json({ error: "Reading not found or not active" }, { status: 404 })

  if (reading.exchangesUsed >= reading.exchangesTotal) {
    return Response.json({ error: "Reading complete — all visions have been spent" }, { status: 403 })
  }

  const transcript: StoredMessage[] = reading.transcript
    ? JSON.parse(reading.transcript)
    : []

  const allCards: string[] = reading.cardsDrawn ? JSON.parse(reading.cardsDrawn) : []
  const isOpening = transcript.length === 0
  const cardsAlreadyDealt = allCards.length > 0

  // --- True random draw: server decides cards before AI is called ---
  let preDrawnCards: DrawnCard[] | undefined
  let spreadName = reading.spread

  if (!isOpening && !cardsAlreadyDealt) {
    // Use the CURRENT message for spread selection so explicit requests like
    // "give me a 7 card spread" are detected, not just the opening greeting
    const spread = chooseSpreadsForConcern(message)
    spreadName = spread.name

    const drawn = shuffleDraw(spread.positions.length)
    preDrawnCards = drawn.map((card, i) => ({ ...card, position: spread.positions[i] }))

    preDrawnCards.forEach((c) => allCards.push(c.name))
  }

  const pastReadings = await prisma.readingSession.findMany({
    where: { userId: session.user.id, status: "complete", id: { not: sessionId } },
    orderBy: { completedAt: "desc" },
    take: 3,
    select: { spread: true, question: true, cardsDrawn: true },
  })
  const pastSummary =
    pastReadings.length > 0
      ? pastReadings
          .map((r) => `${r.question || "unnamed concern"} — spread: ${r.spread || "unknown"}`)
          .join("; ")
      : null

  const exchangesLeft = reading.exchangesTotal - reading.exchangesUsed - 1

  const systemPrompt = buildSystemPrompt(
    reading.user.name,
    reading.user.details,
    pastSummary,
    exchangesLeft,
    preDrawnCards,
    voiceMode
  )

  const anthropicMessages: Anthropic.MessageParam[] = []
  for (const msg of transcript) {
    anthropicMessages.push({
      role: msg.role === "galileo" ? "assistant" : "user",
      content: msg.content,
    })
  }

  // Auto-opening greeting — doesn't count as an exchange
  if (message === "__OPENING__") {
    const greetingResp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 120,
      system: `You are Galileo — an ancient oracle in a moon box. Wry, warm, direct. No asterisks or stage directions.
${reading.user.name ? `The person's name is ${reading.user.name}.` : ""}
You have just appeared. Give a short, mystical, welcoming greeting — 2-3 sentences max. Welcome them by name if you have it. End with an open invitation: what is on their mind, what do they seek, what brought them here. Make it feel alive and different — you have existed since before the first star was named and you have been waiting.`,
      messages: [{ role: "user", content: "The box has opened." }],
    })
    const greeting = greetingResp.content[0].type === "text" ? greetingResp.content[0].text : ""
    return Response.json({
      response: greeting,
      cards: [],
      exchangesUsed: reading.exchangesUsed,
      exchangesTotal: reading.exchangesTotal,
      isComplete: false,
      isGreeting: true,
    })
  }

  const userContent = isOpening
    ? `[First real message after greeting. Respond naturally, then when they share their concern draw the cards.]\n\n${message}`
    : message

  anthropicMessages.push({ role: "user", content: userContent })

  const resp = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: voiceMode ? 180 : preDrawnCards ? 1200 : 800,
    system: systemPrompt,
    messages: anthropicMessages,
  })
  let galileoRaw = resp.content[0].type === "text" ? resp.content[0].text : ""

  // Handle clarifying card request — draw server-side from unused cards
  if (galileoRaw.includes("CLARIFYING_CARD_REQUESTED")) {
    const usedNames = new Set(allCards)
    const remaining = TAROT_DECK.filter((c) => !usedNames.has(c.name))
    if (remaining.length > 0) {
      const pick = remaining[Math.floor(Math.random() * remaining.length)]
      const clarifier: DrawnCard = {
        name: pick.name,
        position: "Clarifying",
        reversed: Math.random() < 0.33,
      }
      allCards.push(clarifier.name)
      const cardLine = `\nCARDS_DRAWN: ${JSON.stringify([clarifier])}\n`
      // Replace all occurrences — only one card drawn regardless
      galileoRaw = galileoRaw.replace(/CLARIFYING_CARD_REQUESTED/g, cardLine)
    } else {
      galileoRaw = galileoRaw.replace(/CLARIFYING_CARD_REQUESTED/g, "")
    }
  }

  // Extract the CARDS_DRAWN line the AI echoes back (or fall back to what we pre-drew)
  let cards: { name: string; position?: string; reversed?: boolean }[] | undefined
  let cleanedResponse = galileoRaw

  const cardsMatch = galileoRaw.match(/CARDS_DRAWN:\s*(\[.*?\])/s)
  if (cardsMatch) {
    try { cards = JSON.parse(cardsMatch[1]) } catch { /* ignore */ }
    cleanedResponse = galileoRaw.replace(/CARDS_DRAWN:\s*\[.*?\]/s, "").trim()
  } else if (preDrawnCards) {
    // AI forgot to echo — use what we drew
    cards = preDrawnCards
  }

  transcript.push({ role: "user", content: message })
  transcript.push({ role: "galileo", content: cleanedResponse, cards })

  const question = reading.question || message
  const newExchangesUsed = reading.exchangesUsed + 1
  const isComplete = newExchangesUsed >= reading.exchangesTotal

  await prisma.readingSession.update({
    where: { id: sessionId },
    data: {
      transcript: JSON.stringify(transcript),
      cardsDrawn: JSON.stringify(allCards),
      spread: spreadName,
      question,
      exchangesUsed: newExchangesUsed,
      status: isComplete ? "complete" : "active",
      completedAt: isComplete ? new Date() : null,
    },
  })

  if (reading.user.details === null) {
    await prisma.userDetails.create({
      data: { userId: session.user.id, concerns: JSON.stringify([question]) },
    })
  }

  return Response.json({
    response: cleanedResponse,
    cards: cards || [],
    exchangesUsed: newExchangesUsed,
    exchangesTotal: reading.exchangesTotal,
    isComplete,
  })
}
