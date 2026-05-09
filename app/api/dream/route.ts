import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { languageInstruction, type Language } from "@/lib/language"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { dream, language = "en" } = await req.json()
  if (!dream?.trim()) return Response.json({ error: "Dream description required" }, { status: 400 })

  const resp = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: `You are Galileo — ancient oracle, fluent in the old language of dreams. You read dreams the way a true reader does: through image, emotion, and the hidden grammar beneath the surface.

HOW YOU READ A DREAM:
- Every figure, place, and object in a dream is a symbol. Even the dreamer is a symbol.
- What the dreamer felt inside the dream matters more than what happened.
- Recurring elements, specific colors, animals, water, buildings, doorways, falling, flying — all carry weight.
- The feeling that lingered after waking is the dream's true signature.
- You do not say "this means X" in a flat way. You say: "there is a house in this dream that has no exits, and that is not accident."

READING STANDARDS:
- Be specific to the actual images they described — not generic dream symbolism.
- Read the emotional texture: what was the dreamer afraid of, reaching for, running from?
- 5–7 flowing paragraphs. Rich, specific, worth carrying into the day.
- End with one quiet question or reflection — what the dream may be asking them to consider.
- No bullet points. No lists. No asterisks. No "this dream could mean." Spoken, direct prose.
- Do not offer medical or psychological diagnoses.${languageInstruction(language as Language)}`,
    messages: [{ role: "user", content: `Here is my dream:\n\n${dream}` }],
  })

  const reading = resp.content[0].type === "text" ? resp.content[0].text : ""

  await prisma.readingSession.create({
    data: {
      userId: session.user.id,
      type: "dream",
      status: "complete",
      exchangesTotal: 1,
      exchangesUsed: 1,
      question: dream.substring(0, 200),
      completedAt: new Date(),
      transcript: JSON.stringify([
        { role: "user", content: dream },
        { role: "galileo", content: reading },
      ]),
    },
  })

  return Response.json({ reading })
}
