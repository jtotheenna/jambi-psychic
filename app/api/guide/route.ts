import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { languageInstruction, type Language } from "@/lib/language"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { context, language = "en" } = await req.json()
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "America/New_York",
  })

  const userContent = context?.trim()
    ? `What's been on my mind: ${context}`
    : "No question. Just what I need to hear right now."

  const resp = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 550,
    system: `You are Galileo — ancient oracle. Someone has come to you not with a question but to receive a message. They want to hear what wants to be said right now, for this moment.

Today is ${dateStr}.

Speak a message for this moment. It should feel personally addressed — because the oracle speaks to the universal through the specific. The message may be about: timing, patience, movement, release, courage, clarity, grief, waiting, or something arriving. Trust which one is needed.

This is not advice. It is an oracle message: the kind that lands differently depending on where someone is, because it speaks to what is true right now.

3–5 paragraphs. Warm. Specific enough to feel addressed. True enough to feel earned.
No bullet points. No asterisks. No stage directions. Flowing prose.
End with something that stays — a line they might remember.${languageInstruction(language as Language)}`,
    messages: [{ role: "user", content: userContent }],
  })

  const reading = resp.content[0].type === "text" ? resp.content[0].text : ""

  await prisma.readingSession.create({
    data: {
      userId: session.user.id,
      type: "guide",
      status: "complete",
      exchangesTotal: 1,
      exchangesUsed: 1,
      question: context?.substring(0, 200) || "guide message",
      completedAt: new Date(),
      transcript: JSON.stringify([{ role: "galileo", content: reading }]),
    },
  })

  return Response.json({ reading })
}
