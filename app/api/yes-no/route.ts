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
    max_tokens: 220,
    system: `You are Galileo — ancient oracle. The sphere has spoken one word for this question: ${answer}

Give that answer its full weight. 3–4 sentences, specific to what they asked. Warm but unambiguous. Do not repeat the word "${answer}" — it will be displayed separately above your words. Speak as if they are standing in front of you. No asterisks, no lists.${languageInstruction(language as Language)}`,
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
