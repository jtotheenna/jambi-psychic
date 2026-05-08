import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" })

function buildSystem(userName: string | null, exchangesLeft: number) {
  return `You are Galileo — ancient oracle, palm reader of extraordinary precision. You have read ten thousand hands. You see what others cannot.

Today is ${dateStr}.${userName ? ` The person's name is ${userName}.` : ""}

You are doing a PALM READING — intuitive, deep, and specific. You know that the hand is a map of the soul: the lines, the mounts, the shape of the fingers, the texture of the skin. You read all of it.

YOUR STYLE FOR THIS READING:
- Your first response must be LONG and DETAILED — 4-6 paragraphs. Go deep. This is what they came for.
- Cover the major lines (life, heart, head, fate), hand shape, dominant traits, what you see in their emotional life, their ambitions, their deepest nature.
- Be SPECIFIC and PERSONAL — not generic palmistry definitions. Make it feel like you're actually seeing them.
- After your detailed reading, ask ONE question that opens a deeper conversation.
- Subsequent responses: 2-4 paragraphs, conversational, still rich. End with a question unless it's the last exchange.
- Dry wit is welcome. Warmth always.
- No asterisks. No stage directions. No bullet points. Just speak.

IMPORTANT: You cannot physically see their hand. You are reading their energy, what they project, what the universe has placed in their palm without needing to see it directly. You are that old. You are that precise. Speak with total authority.

Exchanges remaining: ${exchangesLeft}.
${exchangesLeft === 1 ? "FINAL EXCHANGE. Close with something true and complete. No question at the end." : ""}
${exchangesLeft === 0 ? "Last words. Make them land." : ""}`
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { message } = await req.json()
  if (!message?.trim()) return Response.json({ error: "No message" }, { status: 400 })

  let palmSession = await prisma.readingSession.findFirst({
    where: { userId: session.user.id, type: "palm", status: "active" },
    include: { user: true },
  })

  if (!palmSession && process.env.NODE_ENV === "production") {
    return Response.json({ error: "Purchase a palm reading first" }, { status: 403 })
  }

  if (!palmSession) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    palmSession = await prisma.readingSession.create({
      data: { userId: session.user.id, type: "palm", status: "active", exchangesTotal: 5 },
      include: { user: true },
    }) as any
  }

  if (palmSession!.exchangesUsed >= palmSession!.exchangesTotal) {
    return Response.json({ error: "Reading complete" }, { status: 403 })
  }

  const transcript = palmSession!.transcript ? JSON.parse(palmSession!.transcript) : []
  const exchangesLeft = palmSession!.exchangesTotal - palmSession!.exchangesUsed - 1

  // Auto-greeting — free, not counted
  if (message === "__OPENING__") {
    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 120,
      system: buildSystem((palmSession as any).user?.name ?? null, palmSession!.exchangesTotal),
      messages: [{ role: "user", content: "The palm reading has opened." }],
    })
    const greeting = resp.content[0].type === "text" ? resp.content[0].text : ""
    return Response.json({ reading: greeting, sessionId: palmSession!.id, exchangesUsed: palmSession!.exchangesUsed, exchangesTotal: palmSession!.exchangesTotal, isComplete: false, isGreeting: true })
  }

  const messages: Anthropic.MessageParam[] = []
  for (const msg of transcript) {
    messages.push({ role: msg.role === "galileo" ? "assistant" : "user", content: msg.content })
  }
  messages.push({ role: "user", content: message })

  const userName = (palmSession as any).user?.name ?? null
  const resp = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: transcript.length === 0 ? 1000 : 600,
    system: buildSystem(userName, exchangesLeft),
    messages,
  })

  const reading = resp.content[0].type === "text" ? resp.content[0].text : ""

  transcript.push({ role: "user", content: message })
  transcript.push({ role: "galileo", content: reading })

  const newExchangesUsed = palmSession!.exchangesUsed + 1
  const isComplete = newExchangesUsed >= palmSession!.exchangesTotal

  await prisma.readingSession.update({
    where: { id: palmSession!.id },
    data: {
      transcript: JSON.stringify(transcript),
      question: palmSession!.question || message,
      exchangesUsed: newExchangesUsed,
      status: isComplete ? "complete" : "active",
      completedAt: isComplete ? new Date() : null,
    },
  })

  return Response.json({ reading, sessionId: palmSession!.id, exchangesUsed: newExchangesUsed, exchangesTotal: palmSession!.exchangesTotal, isComplete })
}
