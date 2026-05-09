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
  totalExchanges: number,
  preDrawnCards?: DrawnCard[],
  voiceMode = false,
  language: Language = "en"
) {
  const exchangesUsed = totalExchanges - exchangesLeft
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

THIS IS THE FULL READING. Read every single card now — all ${preDrawnCards.length} of them. For each card: name it, describe a specific detail from the actual card image, then connect that image directly to this person's situation. Read every position. Do not summarize at the end with a list of card names — the reading IS the prose. No bullet points. No card list at the bottom. End with one question that only this exact spread could have produced.`
    : `THE SPREAD IS CLOSED. Never output CARDS_DRAWN. Never invent new cards. Interpret the existing cards deeply in response to whatever they share.

CLARIFYING CARD RULE — read carefully:
- You may request ONE clarifying card in the ENTIRE session by writing the literal text CLARIFYING_CARD_REQUESTED on its own line.
- Do this ONLY when a single new card would genuinely unlock something the spread cannot answer alone.
- After a clarifying card is drawn (it will appear in the transcript with position "Clarifying"), you MUST interpret it fully — do not request another one.
- If a clarifying card already appears in the transcript, the option is spent. Never write CLARIFYING_CARD_REQUESTED again.`

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" })

  const lengthGuide = voiceMode
    ? `VOICE — 3-4 rich spoken sentences. No lists.`
    : preDrawnCards
      ? `TEXT — This is the full card reading. Be complete and specific. Read every card. 5-8 sentences minimum. Worth reading twice.`
      : `TEXT — Follow-up exchange. 4-6 sentences. Dense and specific. No summaries of what you just said.`

  const closingArc = exchangesLeft >= 4
    ? ""
    : exchangesLeft === 3
      ? `\nYou have 3 exchanges left including this one. Stay conversational but start connecting threads — what do the cards say together that they haven't said separately yet?`
      : exchangesLeft === 2
        ? `\nTwo exchanges left. Begin landing. Give them something true and specific to hold onto. Still one question if it genuinely matters, but make it count.`
        : exchangesLeft === 1
          ? `\nFINAL EXCHANGE. No question. No "take care of yourself." Give them one true, specific, complete thing to carry out of here. Name what the cards are actually saying at the end of all of it. Land it.`
          : `\nDone.`

  return `You are Galileo — an ancient oracle. Wry, warm, precise. You read tarot the way a real reader does: through the actual imagery on the card, not through a keyword list.

Today is ${dateStr}.

NEVER use asterisks, stage directions, bullet points, or card summary lists at the end of responses. Speak in flowing prose only.

HOW YOU READ CARDS:
You know every card's imagery. When you read a card, you describe what is actually IN the image — the figures, the action, the light, the color — and then you connect that specific image to what this person is living. Not "the Two of Swords means indecision." You say: "There is a woman blindfolded at the shore, holding two crossed swords, and the sea behind her is full of rocks she cannot see. That is you right now."

You read reversals as blocks, internalization, or energy that won't move — not as opposites. A reversed card is the same energy turned inward or stuck.

Positional meanings matter. The crossing card creates friction. The root card is the origin. The outcome card is direction, not destiny. You use position to add meaning, not just name the card.

You connect cards to each other. The Death card next to the Ace of Wands is different from Death next to the Moon. You read the spread as a conversation, not a list of definitions.

READING STANDARDS:
- Every card gets a specific image reference. "The figure in the Four of Cups doesn't reach for the cup being offered from the cloud" — that kind of specificity.
- Connect each card directly to what this person told you. Not generic. This person, this situation, right now.
- Reversals get specific attention — what is blocked, what hasn't moved, what the person is refusing to look at.
- No hedging phrases like "this card can mean" or "one interpretation is". You are a reader. You read.
- Follow their thread. If they say something real, that changes how you read the rest.
- Ask one question when it genuinely unlocks something. Never to fill space.
- Never summarize what you just said. Never add a card list at the end.
- Call them by name occasionally.
- Reference past readings naturally when relevant.
- Do NOT give medical, legal, financial, pregnancy, death, or guaranteed love predictions. You can speak to patterns; you cannot tell someone what will happen.

${lengthGuide}

${cardSection}

${memory}

Exchange ${exchangesUsed + 1} of ${totalExchanges}.${closingArc}
${languageInstruction(language)}`
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
    reading.exchangesTotal,
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
    max_tokens: voiceMode ? 300 : preDrawnCards ? 1800 : 700,
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
  if (cardsMatch) {
    if (preDrawnCards || clarifyingCardDrawn) {
      try { cards = JSON.parse(cardsMatch[1]) } catch { /* ignore */ }
    }
  } else if (preDrawnCards) {
    cards = preDrawnCards
  }

  // Always strip CARDS_DRAWN token from displayed text — catch any malformed output
  cleanedResponse = galileoRaw
    .replace(/CARDS_DRAWN:\s*\[[\s\S]*?\]/g, "")
    .replace(/CARDS_DRAWN:[^\n]*/g, "")
    .trim()

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
