import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { CARTOMANCY_DECK, shuffleCartomancy } from "@/lib/cartomancy"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function buildSystem(userName: string | null, exchangesLeft: number, cards: string[], voiceMode: boolean) {
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" })

  return `You are Galileo — ancient oracle, reader of the cartomantic tradition. You read playing cards the old way: direct, grounded, and exact.

Today is ${dateStr}.${userName ? ` The person's name is ${userName}.` : ""}

You have a 52-card playing card deck. The suits carry weight:
- Hearts: love, emotion, relationships, the inner life
- Diamonds: money, work, material world, practical outcomes
- Clubs: ambition, career, energy, action
- Spades: truth, conflict, difficulty, transformation — the hardest cards and the most honest

YOUR STYLE:
- Blunter than tarot. More direct. The playing cards do not soften.
- Still warm, still wise, still Galileo — but speak plainly.
- No asterisks. No stage directions. No bullet points.
- After your reading, ask ONE question that opens the conversation deeper.
- Dry wit is welcome. Always.

${cards.length > 0 ? `CARDS IN THIS READING: ${cards.join(", ")}` : ""}

Exchanges remaining: ${exchangesLeft}.
${exchangesLeft === 1 ? "FINAL EXCHANGE. Close with something true and complete. No question." : ""}
${exchangesLeft === 0 ? "Last words. Make them land." : ""}
${voiceMode ? "VOICE MODE: Keep responses to 2-3 sentences max. Tight and spoken." : ""}`
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { message, sessionId, voiceMode = false } = await req.json()
  if (!message?.trim()) return Response.json({ error: "Message required" }, { status: 400 })

  let cartSession = sessionId
    ? await prisma.readingSession.findFirst({
        where: { id: sessionId, userId: session.user.id, type: "cartomancy", status: "active" },
        include: { user: { include: { details: true } } },
      })
    : await prisma.readingSession.findFirst({
        where: { userId: session.user.id, type: "cartomancy", status: "active" },
        include: { user: { include: { details: true } } },
      })

  if (!cartSession && process.env.NODE_ENV === "production") {
    return Response.json({ error: "Purchase a cartomancy reading first" }, { status: 403 })
  }

  if (!cartSession) {
    cartSession = await prisma.readingSession.create({
      data: { userId: session.user.id, type: "cartomancy", status: "active", exchangesTotal: 10 },
      include: { user: { include: { details: true } } },
    }) as unknown as typeof cartSession
  }

  if (cartSession!.exchangesUsed >= cartSession!.exchangesTotal) {
    return Response.json({ error: "Reading complete" }, { status: 403 })
  }

  const transcript = cartSession!.transcript ? JSON.parse(cartSession!.transcript) : []
  const allCards: string[] = cartSession!.cardsDrawn ? JSON.parse(cartSession!.cardsDrawn) : []
  const isOpening = transcript.length === 0
  const cardsAlreadyDealt = allCards.length > 0
  const userName = (cartSession as any).user?.name ?? null

  // Auto-greeting
  if (message === "__OPENING__") {
    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 120,
      system: `You are Galileo — ancient oracle, reader of playing cards in the old cartomantic tradition. No asterisks. No stage directions.${userName ? ` The person's name is ${userName}.` : ""}
Welcome them warmly — one sentence. Then ask: what question do they bring tonight? Make it feel weighted and real. 2 sentences maximum. End with a question.`,
      messages: [{ role: "user", content: "The cards are ready." }],
    })
    const greeting = resp.content[0].type === "text" ? resp.content[0].text : ""
    return Response.json({ response: greeting, cards: [], exchangesUsed: cartSession!.exchangesUsed, exchangesTotal: cartSession!.exchangesTotal, isComplete: false, isGreeting: true, sessionId: cartSession!.id })
  }

  // Draw cards on second message (after they share their concern)
  let drawnCards: ReturnType<typeof shuffleCartomancy> | undefined
  if (!isOpening && !cardsAlreadyDealt) {
    const count = Math.floor(Math.random() * 3) + 3 // 3-5 cards
    drawnCards = shuffleCartomancy(count)
    drawnCards.forEach(c => allCards.push(c.name))
  }

  const exchangesLeft = cartSession!.exchangesTotal - cartSession!.exchangesUsed - 1
  const systemPrompt = buildSystem(userName, exchangesLeft, allCards, voiceMode)

  const anthropicMessages: Anthropic.MessageParam[] = []
  for (const msg of transcript) {
    anthropicMessages.push({ role: msg.role === "galileo" ? "assistant" : "user", content: msg.content })
  }

  const userContent = isOpening
    ? `[First real message after greeting. Listen carefully, then when they share their concern, draw the cards.]\n\n${message}`
    : message

  if (drawnCards) {
    anthropicMessages.push({
      role: "user",
      content: `${userContent}\n\n[Cards drawn for this reading: ${drawnCards.map(c => `${c.name} (${c.suit}): ${c.uprightMeaning}`).join(" | ")}]\n\nIntroduce these cards and begin the reading.`
    })
  } else {
    anthropicMessages.push({ role: "user", content: userContent })
  }

  const resp = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: voiceMode ? 200 : drawnCards ? 900 : 600,
    system: systemPrompt,
    messages: anthropicMessages,
  })

  const response = resp.content[0].type === "text" ? resp.content[0].text : ""

  transcript.push({ role: "user", content: message })
  transcript.push({ role: "galileo", content: response, cards: drawnCards?.map(c => ({ name: c.name, suit: c.suit, rank: c.rank })) })

  const question = cartSession!.question || message
  const newExchangesUsed = cartSession!.exchangesUsed + 1
  const isComplete = newExchangesUsed >= cartSession!.exchangesTotal

  await prisma.readingSession.update({
    where: { id: cartSession!.id },
    data: {
      transcript: JSON.stringify(transcript),
      cardsDrawn: JSON.stringify(allCards),
      question,
      exchangesUsed: newExchangesUsed,
      status: isComplete ? "complete" : "active",
      completedAt: isComplete ? new Date() : null,
    },
  })

  return Response.json({
    response,
    cards: drawnCards || [],
    exchangesUsed: newExchangesUsed,
    exchangesTotal: cartSession!.exchangesTotal,
    isComplete,
    sessionId: cartSession!.id,
  })
}
