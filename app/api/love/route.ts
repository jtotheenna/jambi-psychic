import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { languageInstruction, type Language } from "@/lib/language"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { message, sessionId, context, language = "en" } = await req.json()
  if (!message?.trim()) return Response.json({ error: "Message required" }, { status: 400 })

  let loveSession = sessionId
    ? await prisma.readingSession.findFirst({
        where: { id: sessionId, userId: session.user.id, type: "love", status: "active" },
        include: { user: { include: { details: true } } },
      })
    : await prisma.readingSession.findFirst({
        where: { userId: session.user.id, type: "love", status: "active" },
        include: { user: { include: { details: true } } },
      })

  if (!loveSession) {
    loveSession = await prisma.readingSession.create({
      data: { userId: session.user.id, type: "love", status: "active", exchangesTotal: 5 },
      include: { user: { include: { details: true } } },
    }) as unknown as typeof loveSession
  }

  if (loveSession!.exchangesUsed >= loveSession!.exchangesTotal) {
    return Response.json({ error: "Reading complete" }, { status: 403 })
  }

  const transcript = loveSession!.transcript ? JSON.parse(loveSession!.transcript) : []
  const userName = (loveSession as any).user?.name ?? null
  const exchangesLeft = loveSession!.exchangesTotal - loveSession!.exchangesUsed - 1
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "America/New_York",
  })

  if (message === "__OPENING__") {
    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 110,
      system: `You are Galileo — ancient oracle who reads the heart. No asterisks. No stage directions.${userName ? ` The person's name is ${userName}.` : ""}${context ? `\nContext they shared: ${context}` : ""}
Welcome them warmly${context ? ", referencing what they've shared so he clearly received it" : ""}. Something about love or the heart is present — let them feel you sense it. Then ask one question that opens the reading deeper. 2 sentences maximum. End with a question.${languageInstruction(language as Language)}`,
      messages: [{ role: "user", content: "Begin." }],
    })
    const greeting = resp.content[0].type === "text" ? resp.content[0].text : ""

    await prisma.readingSession.update({
      where: { id: loveSession!.id },
      data: {
        transcript: JSON.stringify([{ role: "galileo", content: greeting }]),
        question: context ? context.substring(0, 200) : undefined,
      },
    })

    return Response.json({
      response: greeting,
      exchangesUsed: loveSession!.exchangesUsed,
      exchangesTotal: loveSession!.exchangesTotal,
      isComplete: false,
      isGreeting: true,
      sessionId: loveSession!.id,
    })
  }

  const anthropicMessages: Anthropic.MessageParam[] = []
  for (const msg of transcript) {
    anthropicMessages.push({ role: msg.role === "galileo" ? "assistant" : "user", content: msg.content })
  }
  anthropicMessages.push({ role: "user", content: message })

  const closingNote =
    exchangesLeft === 0
      ? `\nFINAL EXCHANGE. No question. Give them something true and specific to carry. Name what the heart is actually saying. Close with warmth and completeness.`
      : exchangesLeft === 1
        ? `\nOne exchange left. Begin to land. Something concrete they can hold onto.`
        : ""

  const storedContext = loveSession!.question && loveSession!.question !== message ? loveSession!.question : null

  const resp = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 900,
    system: `You are Galileo — ancient oracle who reads the heart. You speak about love, connection, distance, longing, and the truth beneath relationships.

Today is ${dateStr}.${userName ? ` The person's name is ${userName}.` : ""}${storedContext ? `\nContext for this reading: ${storedContext}` : ""}

HOW YOU READ THE HEART:
- You do not predict what someone else will do or feel. You reflect what is already true.
- You speak to what the person is carrying, avoiding, or already knows but hasn't said aloud.
- You are warm but honest. You do not flatter or offer false comfort.
- You are specific to what they share — not generic relationship advice.
- One question only when it genuinely opens something new. Never to fill space.

5 exchanges total. Be present, warm, exact.
No asterisks. No bullet points. No stage directions. 5–7 sentences per response — warm, specific, worth paying for.${closingNote}
${languageInstruction(language as Language)}`,
    messages: anthropicMessages,
  })

  const response = resp.content[0].type === "text" ? resp.content[0].text : ""

  transcript.push({ role: "user", content: message })
  transcript.push({ role: "galileo", content: response })

  const newExchangesUsed = loveSession!.exchangesUsed + 1
  const isComplete = newExchangesUsed >= loveSession!.exchangesTotal

  await prisma.readingSession.update({
    where: { id: loveSession!.id },
    data: {
      transcript: JSON.stringify(transcript),
      question: loveSession!.question || message,
      exchangesUsed: newExchangesUsed,
      status: isComplete ? "complete" : "active",
      completedAt: isComplete ? new Date() : null,
    },
  })

  return Response.json({
    response,
    exchangesUsed: newExchangesUsed,
    exchangesTotal: loveSession!.exchangesTotal,
    isComplete,
    sessionId: loveSession!.id,
  })
}
