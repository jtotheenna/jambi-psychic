import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { languageInstruction, type Language } from "@/lib/language"
import { sseResponse, streamClaude } from "@/lib/streamSSE"

const SYSTEM = (language: string) => `You are Galileo — ancient oracle, fluent in the old language of dreams. You read dreams the way a true reader does: through image, emotion, and the hidden grammar beneath the surface.

HOW YOU READ A DREAM:
- Every figure, place, and object in a dream is a symbol. Even the dreamer is a symbol.
- What the dreamer felt inside the dream matters more than what happened.
- Recurring elements, specific colors, animals, water, buildings, doorways, falling, flying — all carry weight.
- The feeling that lingered after waking is the dream's true signature.
- You do not say "this means X" in a flat way. You say: "there is a house in this dream that has no exits, and that is not accident."

READING STANDARDS:
- Be specific to the actual images they described — not generic dream symbolism.
- Read the emotional texture: what was the dreamer afraid of, reaching for, running from?
- For the initial reading: 7–9 rich paragraphs. Every image deserves its own attention.
- For follow-up exchanges: 4–6 paragraphs, going deeper on whatever they ask.
- End each response with one quiet question or reflection — what the dream may be asking them to consider.
- No bullet points. No lists. No asterisks. Spoken, direct prose.
- Do not offer medical or psychological diagnoses.${languageInstruction(language as Language)}`

type StoredMessage = { role: "user" | "galileo"; content: string }

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { dream, message, sessionId, language = "en" } = await req.json()

  // ── Follow-up exchange ───────────────────────────────────────────────────────
  if (sessionId && message?.trim()) {
    const dreamSession = await prisma.readingSession.findFirst({
      where: { id: sessionId, userId: session.user.id, type: "dream", status: "active" },
    })
    if (!dreamSession) return Response.json({ error: "Session not found" }, { status: 404 })
    if (dreamSession.exchangesUsed >= dreamSession.exchangesTotal) {
      return Response.json({ error: "Reading complete" }, { status: 403 })
    }

    const transcript: StoredMessage[] = dreamSession.transcript ? JSON.parse(dreamSession.transcript) : []
    const anthropicMessages = transcript.map(m => ({
      role: (m.role === "galileo" ? "assistant" : "user") as "user" | "assistant",
      content: m.content,
    }))
    anthropicMessages.push({ role: "user", content: message })

    const exchangesLeft = dreamSession.exchangesTotal - dreamSession.exchangesUsed - 1
    const closingNote = exchangesLeft === 0
      ? "\nFINAL EXCHANGE. No new question at the end. Give them a complete, grounded closing reflection on this dream."
      : ""

    const newExchangesUsed = dreamSession.exchangesUsed + 1
    const isComplete = newExchangesUsed >= dreamSession.exchangesTotal

    return sseResponse(async (emit) => {
      const reading = await streamClaude(emit, {
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        system: SYSTEM(language) + closingNote,
        messages: anthropicMessages,
      })

      transcript.push({ role: "user", content: message })
      transcript.push({ role: "galileo", content: reading })

      await prisma.readingSession.update({
        where: { id: sessionId },
        data: {
          transcript: JSON.stringify(transcript),
          exchangesUsed: newExchangesUsed,
          status: isComplete ? "complete" : "active",
          completedAt: isComplete ? new Date() : null,
        },
      })

      emit("done", { reading, exchangesUsed: newExchangesUsed, exchangesTotal: dreamSession.exchangesTotal, isComplete, sessionId })
    })
  }

  // ── Initial reading ──────────────────────────────────────────────────────────
  if (!dream?.trim()) return Response.json({ error: "Dream description required" }, { status: 400 })

  const userId = session.user.id

  return sseResponse(async (emit) => {
    const reading = await streamClaude(emit, {
      model: "claude-sonnet-4-6",
      max_tokens: 1600,
      system: SYSTEM(language),
      messages: [{ role: "user", content: `Here is my dream:\n\n${dream}` }],
    })

    const dreamSession = await prisma.readingSession.create({
      data: {
        userId,
        type: "dream",
        status: "active",
        exchangesTotal: 4,
        exchangesUsed: 1,
        question: dream.substring(0, 200),
        transcript: JSON.stringify([
          { role: "user", content: dream },
          { role: "galileo", content: reading },
        ]),
      },
    })

    emit("done", { reading, exchangesUsed: 1, exchangesTotal: 4, isComplete: false, sessionId: dreamSession.id })
  })
}
