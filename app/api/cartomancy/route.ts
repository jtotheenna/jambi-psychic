import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { shuffleCartomancy, CARTOMANCY_SPREADS } from "@/lib/cartomancy"
import { languageInstruction, type Language } from "@/lib/language"
import { sseResponse, streamClaude } from "@/lib/streamSSE"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const CART_WORD_NUMS: Record<string, number> = { one:1,two:2,three:3,four:4,five:5,six:6,seven:7 }
const CART_AUTO = CARTOMANCY_SPREADS.filter(s => s.positions.length >= 5)

async function pickCartomancySpread(question: string) {
  const lower = question.toLowerCase()

  // Explicit numeric request
  const numMatch = lower.match(/\b(\d+)\s*cards?\b/)
  if (numMatch) {
    const n = parseInt(numMatch[1])
    const found = CARTOMANCY_SPREADS.find(s => s.positions.length === n)
    if (found) return found
  }
  for (const [w, n] of Object.entries(CART_WORD_NUMS)) {
    if (new RegExp(`\\b${w}\\s*cards?\\b`).test(lower)) {
      const found = CARTOMANCY_SPREADS.find(s => s.positions.length === n)
      if (found) return found
    }
  }
  if (lower.includes("horseshoe")) return CARTOMANCY_SPREADS.find(s => s.name === "The Horseshoe")!
  if (lower.includes("year"))      return CARTOMANCY_SPREADS.find(s => s.name === "The Year Ahead")!

  // Let Haiku pick like a real cartomancer
  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 20,
      messages: [{
        role: "user",
        content: `You're a professional cartomancer (playing card reader) choosing a spread for this question: "${question.slice(0, 300)}"\n\nPick one:\n${CART_AUTO.map(s => `${s.name} (${s.positions.length} cards) — ${s.description}`).join("\n")}\n\nReply with only the spread name, exactly as written.`,
      }],
    })
    const name = res.content[0].type === "text" ? res.content[0].text.trim() : ""
    return CART_AUTO.find(s => s.name === name) ?? CARTOMANCY_SPREADS.find(s => s.name === "The Horseshoe")!
  } catch {
    return CARTOMANCY_SPREADS.find(s => s.name === "The Horseshoe")!
  }
}

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

YOUR STYLE — be a real card reader:
- Only 5 exchanges total. Front-load the entire reading when cards are first dealt.
- Name every card by name. Say exactly what it means for THIS person, THIS question, THIS moment. "The 7 of Spades here — someone isn't being honest. Maybe them. Maybe you."
- Be generous with depth. They paid $15 for this. Don't ration a single card.
- Blunter than tarot. The playing cards do not soften.
- No asterisks. No stage directions. No bullet points.
- Dry wit welcome. Warmth underneath always.
- One question only when it genuinely opens something new — never to fill space.

${cards.length > 0 ? `CARDS IN THIS READING: ${cards.join(", ")}` : ""}

Exchanges remaining: ${exchangesLeft}.
${exchangesLeft === 1 ? "FINAL EXCHANGE. Give them everything you have left. No question — close it completely and clearly." : ""}
${exchangesLeft === 0 ? "Last words. Make them real." : ""}
${voiceMode ? "VOICE: 3-4 vivid spoken sentences per card." : `TEXT: ${cards.length > 0 ? "Every card gets its own full interpretation — at least 2-3 sentences each, specific to this person. Then show how the cards speak to each other as a spread. Rich, complete, worth reading twice." : "4-5 sentences. Dense and specific."}`}${languageInstruction(language as Language)}`
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
    cartSession = await prisma.readingSession.create({
      data: { userId: session.user.id, type: "cartomancy", status: "active", exchangesTotal: 5 },
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

  // Auto-greeting — streamed SSE so voice plays and text types in live
  if (message === "__OPENING__") {
    const sessionIdToReturn = cartSession!.id
    return sseResponse(async (emit) => {
      const greeting = await streamClaude(emit, {
        model: "claude-sonnet-4-6",
        max_tokens: 140,
        system: `You are Galileo — ancient oracle, reader of playing cards in the old cartomantic tradition. No asterisks. No stage directions. No quotation marks around your words.${userName ? ` The person's name is ${userName}.` : ""}

Every time you open, your energy is different. Sometimes you're wry and dry. Sometimes you open with a specific image — the weight of the deck in your hands, the hush of the room, what the cards are doing tonight. Sometimes you're direct. Sometimes you pull them in slowly. Never repeat the same opening twice.

Open with one sentence that sets a specific mood — not a generic "welcome." Then invite them: what do they bring to the cards tonight? What question, what situation, what feeling they can't name yet? Make it feel like they're stepping into a room with you. 2–3 sentences max. End with a question.${languageInstruction(language as Language)}`,
        messages: [{ role: "user", content: "The cards are ready." }],
      })

      await prisma.readingSession.update({
        where: { id: cartSession!.id },
        data: {
          transcript: JSON.stringify([{ role: "galileo", content: greeting }]),
          cardsDrawn: null, spread: null, question: null, exchangesUsed: 0,
        },
      })

      emit("done", {
        response: greeting, cards: [],
        exchangesUsed: cartSession!.exchangesUsed,
        exchangesTotal: cartSession!.exchangesTotal,
        isComplete: false, isGreeting: true,
        sessionId: sessionIdToReturn,
      })
    })
  }

  // Draw cards on first real question — just check cardsAlreadyDealt, not isOpening
  type DrawnCartomancyCard = ReturnType<typeof shuffleCartomancy>[number] & { position: string }
  let drawnCards: DrawnCartomancyCard[] | undefined
  let spreadName = cartSession!.spread
  if (!cardsAlreadyDealt) {
    const allUserText = [
      ...transcript.filter((m: { role: string }) => m.role === "user").map((m: { content: string }) => m.content),
      message,
    ].join(" ")
    const spread = await pickCartomancySpread(allUserText)
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

  const userContent = message

  if (drawnCards) {
    anthropicMessages.push({
      role: "user",
      content: `${userContent}\n\n[THE ${spreadName?.toUpperCase() || "SPREAD"} HAS BEEN DEALT:\n${drawnCards.map(c => `  ${c.position}: ${c.name} (${c.suit}) — ${c.uprightMeaning}`).join("\n")}]\n\nThis is the full reading. Only ${cartSession!.exchangesTotal} exchanges total — read ALL the cards now, completely. Name every card, interpret every position specifically for this person and their question. Give everything now.`
    })
  } else {
    anthropicMessages.push({ role: "user", content: userContent })
  }

  const sessionRef = cartSession!
  const newExchangesUsed = sessionRef.exchangesUsed + 1
  const isComplete = newExchangesUsed >= sessionRef.exchangesTotal
  const question = sessionRef.question || message
  const cards = drawnCards?.map(c => ({ name: c.name, suit: c.suit, rank: c.rank }))

  return sseResponse(async (emit) => {
    if (drawnCards) emit("cards", { cards, spread: spreadName })

    const response = await streamClaude(emit, {
      model: "claude-sonnet-4-6",
      max_tokens: voiceMode ? 300 : drawnCards ? 1600 : 700,
      system: systemPrompt,
      messages: anthropicMessages,
    })

    transcript.push({ role: "user", content: message })
    transcript.push({ role: "galileo", content: response, cards })

    await prisma.readingSession.update({
      where: { id: sessionRef.id },
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

    emit("done", { response, cards: cards || [], exchangesUsed: newExchangesUsed, exchangesTotal: sessionRef.exchangesTotal, isComplete, sessionId: sessionRef.id })
  })
}
