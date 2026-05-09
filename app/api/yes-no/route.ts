import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { languageInstruction, type Language } from "@/lib/language"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const ANSWERS = ["YES", "NO", "PERHAPS", "NOT YET", "LOOK DEEPER"] as const
type Answer = typeof ANSWERS[number]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { question, language = "en" } = await req.json()
  if (!question?.trim()) return Response.json({ error: "Question required" }, { status: 400 })

  const answer: Answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)]

  const resp = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 900,
    system: `You are Galileo — ancient oracle. The sphere has spoken one word for this question: ${answer}

Write 6 paragraphs giving this answer its full weight and meaning. Each paragraph should explore a different dimension of the answer: the emotional truth, what this answer asks of them, what it reveals about the situation, what is underneath the question itself, what comes next, and a final closing reflection.

Be specific to exactly what they asked. Warm but unambiguous. Never hedge. Speak as though you are sitting across from them in candlelight. The answer "${answer}" will be shown above separately — do not start by repeating it.

No asterisks, no bullet points, no lists. Six flowing paragraphs. This is a $5 reading but it should feel like $50.${languageInstruction(language as Language)}`,
    messages: [{ role: "user", content: question }],
  })

  const reading = resp.content[0].type === "text" ? resp.content[0].text : ""

  await prisma.readingSession.create({
    data: {
      userId: session.user.id,
      type: "yes-no",
      status: "complete",
      exchangesTotal: 1,
      exchangesUsed: 1,
      question: question.substring(0, 200),
      completedAt: new Date(),
      transcript: JSON.stringify([
        { role: "user", content: question },
        { role: "galileo", content: reading },
      ]),
    },
  })

  return Response.json({ answer, reading })
}
