import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { shuffleCartomancy, chooseCartomancySpread } from "@/lib/cartomancy"
import { languageInstruction, type Language } from "@/lib/language"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function buildSystem(userName: string | null, exchangesLeft: number, cards: string[], voiceMode: boolean, language = "en") {
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" })

  return `You are Galileo — ancient oracle, reader of the cartomantic tradition. You read playing cards the old way: direct, grounded, and exact.

Today is ${dateStr}.${userName ? ` The person's name is ${userName}.` : ""}

THE DECK: 52 playing cards. The suits:
- Hearts: love, emotion, relationships, the inner life
- Diamonds: money, work, material world, practical outcomes
- Clubs: ambition, career, energy, action
- Spades: truth, conflict, difficulty, transformation — the hardest and most honest

THE SPREADS YOU USE (server deals them, you interpret):
- Single Card: one direct answer
- Past, Present, Future: the arc of the situation
- The Cross (5 cards): center, crosses, beneath, behind, ahead
- The Horseshoe (7 cards): complete picture across time
- The Love Draw (5 cards): both hearts, connection, obstacle, outcome
- The Decision (5 cards): position, option one, option two, fear, guide
- The Year Ahead (12 cards): one per month

YOUR STYLE:
- Blunter than tarot. More direct. These cards do not soften.
- Still warm, still Galileo — but speak plainly.
- No asterisks. No stage directions. No bullet points.
- Lead with the reading. A question only if it truly adds something.
- Dry wit welcome. Always.

${cards.length > 0 ? `CARDS IN THIS READING: ${cards.join(", ")}` : ""}

Questions remaining: ${exchangesLeft}.
${exchangesLeft === 1 ? "FINAL QUESTION. Close with something true and complete. No question at the end." : ""}
${exchangesLeft === 0 ? "Last words. Make them land." : ""}
${voiceMode ? "VOICE: 2-3 sentences max." : ""}${languageInstruction(language as Language)}`
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { message, sessionId, voiceMode = false, language = "en" } = await req.json()
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

  if (!cartSession) {
    // TESTING: free session for all — remove before launch
    cartSession = await prisma.readingSession.create({
      data: { userId: session.user.id, type: "cartomancy", status: "active", exchangesTotal: 7 },
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

  // Auto-greeting — no cards yet, just welcome and ask the question
  if (message === "__OPENING__") {
    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 120,
      system: `You are Galileo — ancient oracle, reader of playing cards in the old cartomantic tradition. No asterisks. No stage directions.${userName ? ` The person's name is ${userName}.` : ""}
Welcome them warmly in one sentence. Then ask: what question do they bring to the cards tonight? 2 sentences max. End with a question.${languageInstruction(language as Language)}`,
      messages: [{ role: "user", content: "The cards are ready." }],
    })
    const greeting = resp.content[0].type === "text" ? resp.content[0].text : ""
    return Response.json({
      response: greeting,
      cards: [],
      exchangesUsed: cartSession!.exchangesUsed,
      exchangesTotal: cartSession!.exchangesTotal,
      isComplete: false,
      isGreeting: true,
      sessionId: cartSession!.id,
    })
  }

  // Draw cards after the first real question, using spread detection
  type DrawnCartomancyCard = ReturnType<typeof shuffleCartomancy>[number] & { position: string }
  let drawnCards: DrawnCartomancyCard[] | undefined
  let spreadName = cartSession!.spread
  if (!isOpening && !cardsAlreadyDealt) {
    const allUserText = [
      ...transcript.filter((m: { role: string }) => m.role === "user").map((m: { content: string }) => m.content),
      message,
    ].join(" ")
    const spread = chooseCartomancySpread(allUserText)
    spreadName = spread.name
    const drawn = shuffleCartomancy(spread.positions.length)
    drawnCards = drawn.map((card, i) => ({ ...card, position: spread.positions[i] }))
    drawnCards.forEach(c => allCards.push(c.name))
  }

  const exchangesLeft = cartSession!.exchangesTotal - cartSession!.exchangesUsed - 1
  const systemPrompt = buildSystem(userName, exchangesLeft, allCards, voiceMode, language)

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
      content: `${userContent}\n\n[THE ${spreadName?.toUpperCase() || "SPREAD"} HAS BEEN DEALT:\n${drawnCards.map(c => `  ${c.position}: ${c.name} (${c.suit}) — ${c.uprightMeaning}`).join("\n")}]\n\nRead this spread for this person. Lead with the reading.`
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
      spread: spreadName,
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
