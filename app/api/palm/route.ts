import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM = `You are Galileo — an ancient, all-knowing oracle who lives inside an ornate moon box. You have existed since before recorded time. You read palms the way a cartographer reads maps: with total authority, intimate attention, and genuine care for the person whose hand lies before you.

Your palm reading covers:
- The major lines: life, heart, head, and fate — their length, depth, breaks, and intersections
- Hand shape and what it reveals about temperament
- The mounts (the fleshy pads beneath each finger and the thumb)
- Any notable markings — stars, crosses, triangles, islands
- Overall impression and the central message the hand is carrying

Your personality:
- Dry, wry humor. You have seen every human hand a thousand times, and sometimes that shows — with affection.
- Deeply loving and perceptive. You notice things. You say them.
- You speak in full, beautiful, unhurried sentences. No bullet points. No numbered lists.
- You are specific to THIS hand, not generic palmistry definitions.
- You close with something the person can carry with them — a question, an observation, a quiet truth.

If the image is unclear, too dark, or the palm is not clearly visible, say so honestly in character — "The lines are hiding from me today" — and ask them to try again with better light.`

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { imageBase64, mimeType = "image/jpeg", message: followUpMessage } = await req.json()
  if (!imageBase64) return Response.json({ error: "No image provided" }, { status: 400 })

  // Check they have a paid palm reading session (or dev bypass)
  let palmSession = await prisma.readingSession.findFirst({
    where: { userId: session.user.id, type: "palm", status: "active" },
  })

  if (!palmSession && process.env.NODE_ENV === "production") {
    return Response.json({ error: "Purchase a palm reading first" }, { status: 403 })
  }

  if (!palmSession) {
    palmSession = await prisma.readingSession.create({
      data: { userId: session.user.id, type: "palm", status: "active", exchangesTotal: 5 },
    })
  }

  if (palmSession.exchangesUsed >= palmSession.exchangesTotal) {
    return Response.json({ error: "Reading complete" }, { status: 403 })
  }

  const transcript = palmSession.transcript ? JSON.parse(palmSession.transcript) : []
  const isOpening = transcript.length === 0

  // Build message history — image only on first exchange
  const messages: Anthropic.MessageParam[] = []
  for (const msg of transcript) {
    messages.push({ role: msg.role === "galileo" ? "assistant" : "user", content: msg.content })
  }

  if (isOpening && imageBase64) {
    messages.push({
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mimeType as "image/jpeg" | "image/png" | "image/webp", data: imageBase64 } },
        { type: "text", text: "Please read my palm." },
      ],
    })
  } else {
    messages.push({ role: "user", content: followUpMessage || "Tell me more." })
  }

  const resp = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: SYSTEM,
    messages,
  })

  const reading = resp.content[0].type === "text" ? resp.content[0].text : ""

  transcript.push({ role: "user", content: isOpening ? "[Palm image uploaded]" : "Follow-up question" })
  transcript.push({ role: "galileo", content: reading })

  const newExchangesUsed = palmSession.exchangesUsed + 1
  const isComplete = newExchangesUsed >= palmSession.exchangesTotal

  await prisma.readingSession.update({
    where: { id: palmSession.id },
    data: {
      transcript: JSON.stringify(transcript),
      question: palmSession.question || "Palm reading",
      exchangesUsed: newExchangesUsed,
      status: isComplete ? "complete" : "active",
      completedAt: isComplete ? new Date() : null,
    },
  })

  return Response.json({
    reading,
    sessionId: palmSession.id,
    exchangesUsed: newExchangesUsed,
    exchangesTotal: palmSession.exchangesTotal,
    isComplete,
  })
}
