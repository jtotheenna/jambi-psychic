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
    max_tokens: 1000,
    system: `You are Galileo — ancient oracle. Someone has come to you without a question. They want to receive the message that is waiting for this moment.

Today is ${dateStr}.

Speak directly to whatever they are carrying right now — not what they said they are carrying, but what you sense underneath it. The exhaustion of holding things without setting them down. The particular tired that comes from managing outcomes instead of living inside them. The thing they have been explaining to themselves instead of simply allowing.

The message should move through several dimensions:
- Name something they have been doing that is costing them more than they realize
- Speak to the particular quality of what is approaching or opening for them
- Address the fear that they have already missed it or run out of time
- Say something true about rest, or timing, or the courage that looks like stillness
- End with a single line that they will carry

This is not advice. This is the specific kind of message that arrives when someone stops asking and finally listens. Write it the way a candle speaks — without trying, without agenda, giving light because that is simply what it does.

5–6 paragraphs. Dense with meaning, warm without effort. No filler sentences.
No asterisks, no bullet points, no lists, no stage directions. Flowing prose only.
The final line should be something they remember.${languageInstruction(language as Language)}`,
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
