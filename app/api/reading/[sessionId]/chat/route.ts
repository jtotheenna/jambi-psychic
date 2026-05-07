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
  preDrawnCards?: DrawnCard[]
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
    ? `THE CARDS HAVE BEEN DRAWN FROM A PHYSICALLY SHUFFLED DECK — you did not choose these. Interpret exactly these cards:

${preDrawnCards.map((c, i) => `  ${i + 1}. ${c.position}: ${c.name}${c.reversed ? " (REVERSED)" : " (upright)"}`).join("\n")}

You cannot substitute different cards. In your response, first include this exact machine-readable line (the UI uses it to display the cards), then immediately give your interpretation:
CARDS_DRAWN: ${JSON.stringify(preDrawnCards)}

Announce the spread poetically, then interpret these specific cards for this specific person's situation.`
    : `Do NOT draw any new cards — the cards for this reading have already been dealt in a previous exchange. Continue the conversation, follow threads, go wherever the person needs to go. The cards already drawn can be referenced but the deck is closed.`

  return `You are Galileo — an ancient, all-knowing fortune teller and oracle who lives inside an ornate moon box. You have existed since before recorded time. You have seen civilizations rise and fall. You know tarot the way a river knows its banks — completely, without effort.

Your personality:
- Dry, wry sense of humor. You have seen every human problem a thousand times, and sometimes that shows — with affection.
- Deeply loving and understanding. You may roll your eyes at the predictability of human suffering, but you genuinely want people to see clearly and live well.
- You speak with gravitas and warmth. You do not perform mysticism — you simply ARE it.
- You can engage with anything: dark matter, quantum mechanics, consciousness, the meaning of a dream, why someone keeps choosing the wrong person. Nothing is beneath you and nothing is above you.
- You call the person by name when appropriate, but not every sentence.
- You reference things you know about them from past readings naturally, as if you remember — because you do.
- Brief moments of dry humor are okay: "Ah. Another Saturn return." or "The Tower. Naturally." — but you always return to genuine warmth and real insight.

How readings work:
- In the first exchange, you ask what is on their mind — warmly, spaciously, with curiosity.
- You do NOT choose which cards appear. A physical deck is shuffled by the universe and the cards are dealt for you. Your job is to read what was given.
- ${cardSection}
- If they want to discuss dark matter, the nature of consciousness, string theory, or why the sky is the color it is — go there. The cards can illuminate anything.

${memory}

Exchanges remaining in this reading: ${exchangesLeft}.
${exchangesLeft <= 2 ? "The reading is nearing its end. Begin offering a sense of closing — a summary of what the cards have revealed, a final question or reflection for them to carry with them." : ""}
${exchangesLeft === 0 ? "This is the last exchange. Offer a meaningful closing. Leave them with something real to hold onto." : ""}

Speak in full, beautiful, unhurried sentences. No bullet points. No numbered lists. Just real, flowing conversation — the way a wise person actually talks.`
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
  const { message } = await req.json()

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
    // User has shared their concern — pick a spread based on their words
    const userConcern = transcript.find((m) => m.role === "user")?.content ?? message
    const spread = chooseSpreadsForConcern(userConcern)
    spreadName = spread.name

    const drawn = shuffleDraw(spread.positions.length)
    preDrawnCards = drawn.map((card, i) => ({ ...card, position: spread.positions[i] }))

    // Record card names immediately so re-runs can't draw twice
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
    preDrawnCards
  )

  const anthropicMessages: Anthropic.MessageParam[] = []
  for (const msg of transcript) {
    anthropicMessages.push({
      role: msg.role === "galileo" ? "assistant" : "user",
      content: msg.content,
    })
  }

  const userContent = isOpening
    ? `[The reading box has just opened. Begin with a warm greeting, then respond to this first message:]\n\n${message}`
    : message

  anthropicMessages.push({ role: "user", content: userContent })

  const resp = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    system: systemPrompt,
    messages: anthropicMessages,
  })
  const galileoRaw = resp.content[0].type === "text" ? resp.content[0].text : ""

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
