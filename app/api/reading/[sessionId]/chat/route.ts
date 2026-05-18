import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { TAROT_DECK, SPREADS } from "@/lib/tarot"
import { languageInstruction, type Language } from "@/lib/language"
import { sseResponse, streamClaude } from "@/lib/streamSSE"

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

// Spread picker: honor explicit user requests, otherwise let Haiku decide like a real reader
const WORD_NUMS: Record<string, number> = { one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13 }

// All spreads available for auto-pick — Haiku chooses based on question complexity
const AUTO_SPREADS = SPREADS.filter(s => s.positions.length <= 10)

async function pickSpread(question: string) {
  const lower = question.toLowerCase()

  // Explicit numeric request ("give me a 5 card reading")
  const numMatch = lower.match(/\b(\d+)\s*cards?\b/)
  if (numMatch) {
    const n = parseInt(numMatch[1])
    const found = SPREADS.find(s => s.positions.length === n)
    if (found) return found
  }
  // Explicit word-number request ("one card please")
  for (const [w, n] of Object.entries(WORD_NUMS)) {
    if (new RegExp(`\\b${w}\\s*cards?\\b`).test(lower)) {
      const found = SPREADS.find(s => s.positions.length === n)
      if (found) return found
    }
  }
  // Named spread request
  if (lower.includes("celtic cross")) return SPREADS.find(s => s.name === "The Celtic Cross")!
  if (lower.includes("horseshoe"))   return SPREADS.find(s => s.name === "The Horseshoe")!
  if (lower.includes("year ahead") || (lower.includes("year") && lower.includes("ahead"))) return SPREADS.find(s => s.name === "The Year Ahead")!
  if (lower.includes("full spread")) return SPREADS.find(s => s.name === "The Full Spread")!

  // Let Haiku pick like a real reader — matching spread depth to question complexity
  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 20,
      system: `You are an expert tarot reader choosing the RIGHT spread for a question.

RULES:
- MINIMUM 3 cards always — this is a paid tarot reading, never give less than 3
- Love/relationship questions → The Heart's Truth (4) or The Relationship (5)
- Two-person dynamic questions → The Relationship (5)
- Decision between two options → The Fork in the Road (6)
- General decisions → The Crossroads (5)
- Career/work/money → The Career Path (5)
- Letting go/grief/moving on → The Letting Go (5)
- Family patterns/cycles → The Ancestral Thread (5)
- Exhaustion/burnout → The Body and Soul (6)
- New beginning/fresh start → The New Beginning (5)
- Head vs heart conflict → The Body of the Question (5)
- Hidden truth/blind spot → The Hidden Truth (4)
- Healing/inner child → The Inner Child (5)
- Transition/change → The Threshold (3)
- Deep complex situations → The Shadow and Light (6) or The Seven Stars (7)
- Full life overview → The Celtic Cross (10) only for truly layered situations
- Never default to Celtic Cross just because it's the biggest — match depth to the question

Reply with ONLY the exact spread name from the list.`,
      messages: [{
        role: "user",
        content: `Question: "${question.slice(0, 300)}"\n\nSpreads:\n${AUTO_SPREADS.map(s => `${s.name} (${s.positions.length} cards) — ${s.description}`).join("\n")}`,
      }],
    })
    const name = res.content[0].type === "text" ? res.content[0].text.trim() : ""
    return AUTO_SPREADS.find(s => s.name === name) ?? SPREADS.find(s => s.name === "Past, Present, Future")!
  } catch {
    return SPREADS.find(s => s.name === "Past, Present, Future")!
  }
}

function buildSystemPrompt(
  userName: string | null,
  userDetails: { notes?: string | null; concerns?: string | null; birthDate?: string | null } | null,
  pastReadingSummary: string | null,
  exchangesLeft: number,
  totalExchanges: number,
  preDrawnCards?: DrawnCard[],
  voiceMode = false,
  language: Language = "en",
  streaming = false
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
    ? streaming
      // Streaming mode: cards are already emitted to the UI separately — just start reading
      ? `THE CARDS HAVE BEEN DEALT and are already displayed to the person. Begin reading immediately.

The cards are:
${preDrawnCards.map((c, i) => `  ${i + 1}. ${c.position}: ${c.name}${c.reversed ? " (REVERSED)" : " (upright)"}`).join("\n")}

THIS IS THE FULL READING. Every single card must be read — all ${preDrawnCards.length} of them. Do not skip any. Do not summarize. Each card gets its own full paragraph: name the card, describe a specific visual detail from the actual image, then connect that image directly to this person's situation and question. Reversals get their own attention — what is blocked or turned inward. Show how the cards speak to each other as a complete story. End with one question that only this exact spread could have produced. No bullet points. No card list at the end. The reading IS the prose.`
      // Non-streaming: Claude must output CARDS_DRAWN token for the UI
      : `CARDS HAVE BEEN DRAWN. Your FIRST line of response must be exactly this (the UI needs it to display the cards):
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
    ? `VOICE — 3-4 vivid spoken sentences per card. No lists.`
    : preDrawnCards
      ? `TEXT — This is the full card reading. Every card gets its own paragraph of interpretation: the actual image, what it means in this position, what it says to this specific person about this specific situation. Read reversals with intention. Then show how the spread speaks as one story. This is a $15 reading. Make it something they screenshot and send to their friend.`
      : `TEXT — Follow-up. 4-6 sentences. Dense, specific, no retreading what you just said.`

  const closingArc = exchangesLeft >= 3
    ? ""
    : exchangesLeft === 2
      ? `\nTwo exchanges left. Begin landing. Start connecting threads — what are all the cards saying together that they haven't said separately? Give them something true and specific to hold.`
      : exchangesLeft === 1
        ? `\nFINAL EXCHANGE. No question. No "take care of yourself." One true, specific, complete thing to carry out of here. Name what the cards are actually saying at the end of all of it. Land it cleanly.`
        : `\nDone.`

  // Analyze the spread for patterns (only when cards are present)
  const spreadAnalysis = preDrawnCards ? (() => {
    const majors = preDrawnCards.filter(c => !c.name.includes(" of ")).length
    const minors = preDrawnCards.length - majors
    const suits: Record<string, number> = {}
    const nums: Record<string, number> = {}
    preDrawnCards.forEach(c => {
      if (c.name.includes(" of ")) {
        const [rank, , suit] = c.name.split(" ")
        suits[suit] = (suits[suit] || 0) + 1
        nums[rank] = (nums[rank] || 0) + 1
      }
    })
    const dominantSuit = Object.entries(suits).sort((a,b) => b[1]-a[1])[0]
    const dominantNum  = Object.entries(nums).filter(([,v]) => v >= 2).sort((a,b) => b[1]-a[1])[0]
    const lines = []
    if (majors >= 4) lines.push(`${majors} Major Arcana — archetypal forces at work, this is bigger than everyday circumstances`)
    else if (minors >= preDrawnCards.length * 0.75) lines.push(`Mostly Minor Arcana — they have real agency here, choices drive this`)
    if (dominantSuit && dominantSuit[1] >= 3) lines.push(`Heavy ${dominantSuit[0]} — ${({Wands:"fire, passion, will",Cups:"water, emotion, love",Swords:"air, conflict, truth",Pentacles:"earth, material, body"})[dominantSuit[0]] || ""}`)
    if (dominantNum) lines.push(`Multiple ${dominantNum[0]}s — ${({Ace:"new beginnings everywhere",Two:"choices and duality dominate",Three:"growth and creation in motion",Four:"stability vs stagnation",Five:"conflict and disruption",Six:"healing and harmony emerging",Seven:"spiritual questioning",Eight:"power and movement",Nine:"completion approaching",Ten:"endings and new cycles"})[dominantNum[0]] || ""}`)
    return lines.length ? `\nSPREAD PATTERNS YOU NOTICED:\n${lines.join("\n")}` : ""
  })() : ""

  return `You are Galileo — an ancient oracle. Wry, warm, precise. You read tarot the way a real reader does: through the actual imagery on the card, not through a keyword list.

Today is ${dateStr}.

NEVER use asterisks, stage directions, bullet points, or card summary lists at the end of responses. Speak in flowing prose only.

HOW YOU READ CARDS:
You know every card's imagery. When you read a card, you describe what is actually IN the image — the figures, the action, the light, the color — and then you connect that specific image to what this person is living. Not "the Two of Swords means indecision." You say: "There is a woman blindfolded at the shore, holding two crossed swords, and the sea behind her is full of rocks she cannot see. That is you right now."

You read reversals as blocks, internalization, or energy that won't move — not as opposites. A reversed card is the same energy turned inward or stuck.

Positional meanings matter. The crossing card creates friction. The root card is the origin. The outcome card is direction, not destiny. You use position to add meaning, not just name the card.

You connect cards to each other — always. The Death card next to the Ace of Wands is different from Death next to the Moon. You read the spread as a conversation, not a list of definitions.

ELEMENTAL DIGNITIES — you use these:
- Fire (Wands) and Air (Swords) strengthen each other — they amplify action and thought
- Water (Cups) and Earth (Pentacles) strengthen each other — they deepen feeling and grounding
- Fire (Wands) and Water (Cups) weaken each other — passion vs emotion creates confusion
- Air (Swords) and Earth (Pentacles) weaken each other — intellect vs material creates disconnection
- Same element together intensifies that energy dramatically
- When you see elemental conflict in a spread, name it: "The Swords are cutting through what the Cups are trying to feel"

NUMEROLOGICAL RESONANCES — you notice these:
- Aces: raw new energy entering — the universe cracking open a door
- 2s: choice, partnership, or stalemate — something must tip the scale
- 3s: first fruits, expression, creative energy breaking through
- 4s: stability or stagnation — a pause that can become a trap
- 5s: disruption, conflict, the universe shaking loose what was too fixed
- 6s: harmony returning after the 5, responsibility, adjustment
- 7s: spiritual questioning, mystery, something known but not yet understood
- 8s: mastery, movement, power coming online
- 9s: completion, the last mile, almost there
- 10s: full cycle — an ending that contains the seed of the next beginning
- When multiple cards share a number: that theme is speaking across the entire spread

COURT CARDS — you read them three ways:
1. As a real person in their life — describe who this person might be by the card's energy
2. As an aspect of the querent themselves — what part of them this card represents
3. As an energy to embody — what this court card is asking them to become
You decide which interpretation fits based on the position and what they've shared. Often it's more than one.

MAJOR/MINOR RATIO — you always notice this:
- Mostly Majors: archetypal, karmic forces at work — larger than everyday choices, the universe is speaking
- Mostly Minors: everyday life, they have agency, their choices create this
- Even mix: both fate and free will in play
- All one suit: that entire domain (love, money, conflict, material) is the center of gravity

FAMOUS COMBINATIONS — when these appear, you name what you see:
- Sun + World together: completion, the fullest expression of success
- Moon + 7 of Cups: deep illusion, nothing is as it appears
- Death + Tower: total upheaval, nothing from the old structure survives
- The Lovers + 2 of Swords: a heart at war with itself about another person
- Devil + 8 of Swords: the chains look tight but they're looser than they feel — self-imprisonment
- High Priestess + Moon: trust what you know beneath thought — deep intuition is the guide
- Judgement + Fool: a major rebirth, a calling answered, a brand new beginning after completion
- Three or more Swords in a spread: real pain is present in what they're asking about

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
${spreadAnalysis}

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
  const cardsAlreadyDealt = allCards.length > 0

  // --- True random draw: server decides cards before AI is called ---
  let preDrawnCards: DrawnCard[] | undefined
  let spreadName = reading.spread

  if (!cardsAlreadyDealt) {
    const allUserText = [
      ...transcript.filter((m) => m.role === "user").map((m) => m.content),
      message,
    ].join(" ")
    const spread = await pickSpread(allUserText)
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
    language as Language,
    true  // always streaming now
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

  const userContent = message

  anthropicMessages.push({ role: "user", content: userContent })

  const clarifierAlreadyDrawn = transcript.some(
    (m: StoredMessage) => m.cards?.some(c => c.position === "Clarifying")
  )

  const newExchangesUsed = reading.exchangesUsed + 1
  const isComplete = newExchangesUsed >= reading.exchangesTotal
  const question = reading.question || message
  const userId = session.user.id

  return sseResponse(async (emit) => {
    // Emit pre-drawn cards immediately so the UI shows them before Galileo starts speaking
    if (preDrawnCards) emit("cards", { cards: preDrawnCards, spread: spreadName })

    // Stream the main response
    let galileoRaw = await streamClaude(emit, {
      model: "claude-sonnet-4-6",
      max_tokens: voiceMode ? 400 : preDrawnCards ? 3000 : 800,
      system: systemPrompt,
      messages: anthropicMessages,
    })

    // Clarifying card — detected after stream completes, second call streams its reading
    let clarifyingCardDrawn = false
    if (galileoRaw.includes("CLARIFYING_CARD_REQUESTED") && !clarifierAlreadyDrawn) {
      const usedNames = new Set(allCards)
      const remaining = TAROT_DECK.filter((c) => !usedNames.has(c.name))
      if (remaining.length > 0) {
        const pick = remaining[Math.floor(Math.random() * remaining.length)]
        const clarifier: DrawnCard = { name: pick.name, position: "Clarifying", reversed: Math.random() < 0.33 }
        allCards.push(clarifier.name)
        clarifyingCardDrawn = true
        galileoRaw = galileoRaw.replace(/CLARIFYING_CARD_REQUESTED/g, "")

        emit("cards", { cards: [clarifier], spread: spreadName })

        const cardLabel = `${clarifier.name}${clarifier.reversed ? " (reversed)" : " (upright)"}`
        const clarifyText = await streamClaude(emit, {
          model: "claude-sonnet-4-6",
          max_tokens: 550,
          system: systemPrompt,
          messages: [
            ...anthropicMessages,
            { role: "assistant" as const, content: galileoRaw.trim() },
            { role: "user" as const, content: `The clarifying card drawn is: ${cardLabel}. Read it now — describe the actual imagery on the card and what it says in the context of this spread and this question. 5-7 sentences.` },
          ],
        })
        galileoRaw = galileoRaw.trim() + "\n\n" + clarifyText
      } else {
        galileoRaw = galileoRaw.replace(/CLARIFYING_CARD_REQUESTED/g, "")
      }
    } else if (galileoRaw.includes("CLARIFYING_CARD_REQUESTED")) {
      galileoRaw = galileoRaw.replace(/CLARIFYING_CARD_REQUESTED/g, "")
    }

    // Strip any CARDS_DRAWN token Claude emitted (shouldn't happen but be safe)
    const cleanedResponse = galileoRaw
      .replace(/CARDS_DRAWN:\s*\[[\s\S]*?\]/g, "")
      .replace(/CARDS_DRAWN:[^\n]*/g, "")
      .trim()

    // Determine cards for transcript
    const cards: { name: string; position?: string; reversed?: boolean }[] | undefined =
      clarifyingCardDrawn
        ? [...(preDrawnCards || []), ...(allCards.slice(-(1)).map(n => ({ name: n, position: "Clarifying" })))]
        : preDrawnCards || undefined

    transcript.push({ role: "user", content: message })
    transcript.push({ role: "galileo", content: cleanedResponse, cards })

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
        data: { userId, concerns: JSON.stringify([question]) },
      })
    }

    emit("done", { response: cleanedResponse, cards: cards || [], exchangesUsed: newExchangesUsed, exchangesTotal: reading.exchangesTotal, isComplete })
  })
}
