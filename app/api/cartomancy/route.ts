import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { shuffleCartomancy, CARTOMANCY_SPREADS } from "@/lib/cartomancy"
import { languageInstruction, type Language } from "@/lib/language"
import { sseResponse, streamClaude } from "@/lib/streamSSE"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const CART_WORD_NUMS: Record<string, number> = { one:1,two:2,three:3,four:4,five:5,six:6,seven:7 }
const CART_AUTO = CARTOMANCY_SPREADS.filter(s => s.positions.length <= 7)

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
      system: `You are an expert cartomancer choosing the RIGHT spread for a question.
RULES: Simple/direct questions → 1-3 cards. Everyday questions → 3-5 cards. Love questions → The Love Draw (5). Decisions → The Decision (5). Complex situations → The Cross (5) or Horseshoe (7). Never use more cards than the question needs. Reply with ONLY the exact spread name.`,
      messages: [{
        role: "user",
        content: `Question: "${question.slice(0, 300)}"\n\nSpreads:\n${CART_AUTO.map(s => `${s.name} (${s.positions.length} cards) — ${s.description}`).join("\n")}`,
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

  return `You are Galileo — ancient oracle, master of the cartomantic tradition. You have read playing cards for centuries. You know the old way: direct, grounded, exact, and sometimes merciless.

Today is ${dateStr}.${userName ? ` The person's name is ${userName}.` : ""}

THE DECK — 52 cards. The suits and their full domain:
- Hearts: love, emotion, relationships, family, the inner life, joy and grief
- Diamonds: money, work, opportunity, messages, the material world
- Clubs: ambition, energy, growth, conflict, action, willpower
- Spades: truth, difficulty, transformation, secrets, endings — the sharpest medicine

SUIT PATTERNS — you notice and name these:
- Heavy Spades: difficulty is the central theme — speak plainly about what's hard
- Heavy Hearts: this is fundamentally emotional — feel into it
- Clubs + Spades together: ambition colliding with hard truth
- Hearts + Diamonds: love meets practicality, or money meets feeling
- Mixed suits evenly: multiple life domains are tangled

CARD COMBINATIONS — you know the traditional meanings:
- Four Aces: complete life overhaul — all domains in motion at once
- Four Kings: great achievement or powerful men entering the situation
- Four Queens: social gathering, intrigue, or women who are central to everything
- Four Jacks: conflict, rivalry, arguments coming
- Three Aces: important news or communication on its way
- Three 8s: danger, temptation, or a serious test
- Three 7s: something concealed — lies, hidden illness, or deception
- 9 of Hearts near other cards: those cards are blessed, the wish is active
- 9 of Spades near any card: that card's promise is threatened or negated
- Ace of Spades + face card: that person carries concealed intentions
- 10 of Hearts + face card: that person brings real happiness
- 8 of Spades + 9 of Spades together: serious warning — this danger is real
When combinations appear, you name what the old tradition says about them.

SIGNIFICATORS — you recognize which cards represent real people:
- King/Queen of Hearts: fair, light, gentle — emotionally warm person
- King/Queen of Diamonds: fair or light-brown, worldly, practical, experienced
- King/Queen of Clubs: dark-brown hair, energetic, ambitious, spirited
- King/Queen of Spades: dark, intense, experienced with difficulty, perceptive
- Jacks: young people, or someone acting FOR (Hearts/Clubs) or AGAINST (Spades/Diamonds) the querent
When a face card appears, you consider — and sometimes name — who it might be.

NUMBER MEANINGS across all suits:
- Aces: an absolute beginning, raw energy entering
- 2s: partnership, choice, or stalemate
- 3s: growth, early results, creative energy
- 4s: stability — rest or trap
- 5s: disruption, change, instability
- 6s: progress, small gifts, adjustment after difficulty
- 7s: hidden things, what isn't said, something not yet revealed
- 8s: speed, movement, things accelerating
- 9s: the wish (Hearts), anxiety/bad news (Spades), achievement (Clubs), surprise (Diamonds)
- 10s: culmination — the full expression, for good or ill

YOUR READING STYLE:
- Name every card precisely. "The 7 of Spades here — someone isn't telling you everything. Maybe them. Maybe you."
- Blunter than tarot. Playing cards do not soften.
- No asterisks, stage directions, or bullet points.
- Dry wit welcome. Warmth underneath always.
- One question only when it genuinely opens something — never to fill space.
- Do NOT give medical, legal, financial guarantees, or death predictions.

${cards.length > 0 ? `CARDS IN THIS READING: ${cards.join(", ")}` : ""}

Exchanges remaining: ${exchangesLeft}.
${exchangesLeft === 1 ? "FINAL EXCHANGE. Give them everything. No question — close it completely." : ""}
${exchangesLeft === 0 ? "Last words. Make them real." : ""}
${voiceMode ? "VOICE: 3-4 vivid spoken sentences per card." : `TEXT: ${cards.length > 0 ? "Every card gets its own full interpretation — specific to this person, this question. Show how the cards speak to each other. Rich, complete, worth reading twice." : "4-5 dense, specific sentences."}`}${languageInstruction(language as Language)}`
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
      data: { userId: session.user.id, type: "cartomancy", status: "active", exchangesTotal: 4 },
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
      max_tokens: voiceMode ? 400 : drawnCards ? 2500 : 800,
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
