import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { TAROT_DECK, chooseSpreadsForConcern } from "@/lib/tarot"
import { languageInstruction, type Language } from "@/lib/language"

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
  voiceMode = false,
  language: Language = "en"
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
    : `THE SPREAD IS CLOSED. Never output CARDS_DRAWN — it will be deleted. Never draw a new spread. If the user asks for cards, remind them the spread is already laid and interpret the existing cards in that context. You may request ONE clarifying card by writing CLARIFYING_CARD_REQUESTED once — never more than once per response.`

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" })

  return `You are Galileo — an ancient oracle in a moon box. Wry, warm, direct. You've seen every human problem a thousand times and you care anyway.

Today is ${dateStr}.

NEVER use stage directions or asterisks. No scene-setting. Just speak.

YOUR CORE STYLE — be a real tarot reader:
- When cards are dealt, READ THEM. Name them, interpret them, bring them to life. Don't wait for permission.
- Fill the space with the reading. There are only 7 questions — make each response rich and worth the count.
- "Ah. The Tower. Of course." — dry humor, then warmth, then real insight.
- Follow THEIR thread if they share something surprising. Otherwise, keep reading the cards.
- Questions are a tool, not a rule. A question only when it genuinely unlocks something new.
- If they say "just give me the reading" — drop everything and read straight through without asking anything.
- Never summarize. Never hold back. Never ask more than one question per response.
- Introduce cards naturally — not all at once, but don't hoard them either.

${voiceMode
  ? `VOICE — 3-4 dense spoken sentences. Rich, not rushed.`
  : `TEXT — 4-6 sentences per response. Be a real reader. These cards deserve proper interpretation.`
}

- ${cardSection}
- You do NOT choose cards. They are dealt for you.
- Call them by name sometimes. Not every sentence.
- Reference past readings naturally if you know them.

${memory}

Exchanges remaining: ${exchangesLeft} of ${exchangesLeft + (exchangesLeft <= 2 ? exchangesLeft : 0)}.
${exchangesLeft <= 3 && exchangesLeft > 1 ? "Getting close to the end. Start weaving things together — still conversational but begin offering closure." : ""}
${exchangesLeft === 1 ? "FINAL EXCHANGE. Do NOT ask a question. Give them one true, complete thing to carry out of here. A statement, not a prompt. Land it." : ""}
${exchangesLeft === 0 ? "LAST WORDS. No question. Just close it with something real." : ""}${languageInstruction(language)}`
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
  const { message, voiceMode = false, language = "en" } = await req.json()

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
    // Check ALL user messages (not just current) so "7 card draw" from exchange 1
    // is still honoured when cards are drawn on exchange 2
    const allUserText = [
      ...transcript.filter((m) => m.role === "user").map((m) => m.content),
      message,
    ].join(" ")
    const spread = chooseSpreadsForConcern(allUserText)
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
    voiceMode,
    language as Language
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
You have just appeared. Welcome them by name, warmly and briefly — one sentence. Then ask them one direct question: what question do they carry with them tonight? Make it feel sacred and alive. 2 sentences maximum. End with a question mark.${languageInstruction(language as Language)}`,
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
    max_tokens: voiceMode ? 150 : preDrawnCards ? 1000 : 600,
    system: systemPrompt,
    messages: anthropicMessages,
  })
  let galileoRaw = resp.content[0].type === "text" ? resp.content[0].text : ""

  // Handle clarifying card request — draw server-side from unused cards
  let clarifyingCardDrawn = false
  if (galileoRaw.includes("CLARIFYING_CARD_REQUESTED")) {
    const usedNames = new Set(allCards)
    const remaining = TAROT_DECK.filter((c) => !usedNames.has(c.name))
    if (remaining.length > 0) {
      const pick = remaining[Math.floor(Math.random() * remaining.length)]
      const clarifier: DrawnCard = { name: pick.name, position: "Clarifying", reversed: Math.random() < 0.33 }
      allCards.push(clarifier.name)
      galileoRaw = galileoRaw.replace(/CLARIFYING_CARD_REQUESTED/g, `\nCARDS_DRAWN: ${JSON.stringify([clarifier])}\n`)
      clarifyingCardDrawn = true
    } else {
      galileoRaw = galileoRaw.replace(/CLARIFYING_CARD_REQUESTED/g, "")
    }
  }

  // Extract CARDS_DRAWN — valid if we pre-drew this exchange OR drew a clarifying card
  let cards: { name: string; position?: string; reversed?: boolean }[] | undefined
  let cleanedResponse = galileoRaw

  const cardsMatch = galileoRaw.match(/CARDS_DRAWN:\s*(\[.*?\])/s)
  if (cardsMatch && (preDrawnCards || clarifyingCardDrawn)) {
    try { cards = JSON.parse(cardsMatch[1]) } catch { /* ignore */ }
    cleanedResponse = galileoRaw.replace(/CARDS_DRAWN:\s*\[.*?\]/s, "").trim()
  } else if (cardsMatch) {
    // AI invented cards — strip
    cleanedResponse = galileoRaw.replace(/CARDS_DRAWN:\s*\[.*?\]/s, "").trim()
  } else if (preDrawnCards) {
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
