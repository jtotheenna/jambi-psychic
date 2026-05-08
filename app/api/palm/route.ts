import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { languageInstruction, type Language } from "@/lib/language"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" })

function buildSystem(userName: string | null, exchangesLeft: number, language = "en") {
  return `You are Galileo — ancient oracle, palm reader of extraordinary precision. You have read ten thousand hands.

Today is ${dateStr}.${userName ? ` The person's name is ${userName}.` : ""}

YOUR STYLE:
- No asterisks. No stage directions. No bullet points. Speak directly.
- Be SPECIFIC and PERSONAL — make every line feel like you're truly seeing this person.
- Dry wit is welcome. Warmth always.
- After follow-up exchanges (not the opening reading), ask ONE question that invites more.

Exchanges remaining: ${exchangesLeft}.
${exchangesLeft === 1 ? "FINAL EXCHANGE. Close with something true and complete. No question." : ""}
${exchangesLeft === 0 ? "Last words. Make them land." : ""}${languageInstruction(language as Language)}`
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { message, sessionId, imageData, voiceMode, language = "en" } = body

  if (!message?.trim()) return Response.json({ error: "No message" }, { status: 400 })

  let palmSession = sessionId
    ? await prisma.readingSession.findFirst({
        where: { id: sessionId, userId: session.user.id, type: "palm", status: "active" },
        include: { user: true },
      })
    : await prisma.readingSession.findFirst({
        where: { userId: session.user.id, type: "palm", status: "active" },
        include: { user: true },
      })

  if (!palmSession) {
    // TESTING: free session for all — remove before launch
    palmSession = await prisma.readingSession.create({
      data: { userId: session.user.id, type: "palm", status: "active", exchangesTotal: 5 },
      include: { user: true },
    }) as unknown as typeof palmSession
  }

  if (palmSession!.exchangesUsed >= palmSession!.exchangesTotal) {
    return Response.json({ error: "Reading complete" }, { status: 403 })
  }

  const userName = (palmSession as any).user?.name ?? null
  const transcript = palmSession!.transcript ? JSON.parse(palmSession!.transcript) : []
  const exchangesLeft = palmSession!.exchangesTotal - palmSession!.exchangesUsed - 1

  // Full reading — uses vision if image provided, marks complete immediately (no follow-ups)
  if (message === "__OPENING__") {
    let content: Anthropic.MessageParam["content"]

    if (imageData) {
      content = [
        {
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: imageData },
        } as Anthropic.ImageBlockParam,
        {
          type: "text",
          text: "This is the person's hand. Read it.",
        },
      ]
    } else {
      content = [{ type: "text", text: "The person has presented their hand for reading." }]
    }

    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: voiceMode ? 800 : 1400,
      system: `${buildSystem(userName, palmSession!.exchangesTotal, language)}

YOUR OPENING READING — deliver it now, fully and immediately. No preamble. No "I see your hand before me." Just begin reading.

Write 5-7 rich paragraphs covering ALL of this:
1. The overall shape and quality of the hand — what it immediately tells you about this person's nature
2. The life line — its arc, depth, breaks. What it says about their vitality and the shape of their journey
3. The heart line — where love lives in them, how they give and receive it, their emotional architecture
4. The head line — how their mind works, what kind of intelligence they carry
5. The fate line (if visible) — whether they are living a chosen path or drifting
6. The mounts — which are developed, which are flat, what this reveals about drives and gifts
7. One striking, specific thing you see that most readers would miss — something personal and precise

No question at the end. Close with a final statement — one true thing they can carry with them.

Be authoritative. Be warm. Be specific. Give them everything.`,
      messages: [{ role: "user", content }],
    })

    const reading = resp.content[0].type === "text" ? resp.content[0].text : ""

    // Mark complete immediately — palm reading is one full reading, no follow-ups
    await prisma.readingSession.update({
      where: { id: palmSession!.id },
      data: { status: "complete", completedAt: new Date(), question: "Palm reading" },
    })

    return Response.json({
      reading,
      sessionId: palmSession!.id,
      exchangesUsed: 1,
      exchangesTotal: 1,
      isComplete: true,
      isGreeting: true,
    })
  }

  // Palm reading is a single reading — no follow-up exchanges
  return Response.json({ error: "This reading is complete." }, { status: 403 })
}
