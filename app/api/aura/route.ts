import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { languageInstruction, type Language } from "@/lib/language"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { imageData, colors, language = "en" } = await req.json()
  if (!imageData) return Response.json({ error: "Image required" }, { status: 400 })

  const colorContext = colors?.length > 0
    ? `DETECTED AURA COLORS (extracted from the actual image):\n${colors.map((c: { name: string; percentage: number }) => `  ${c.name}: ${c.percentage}%`).join("\n")}\n\nThese are the real dominant colors present in this photograph. Your reading must reference them specifically.`
    : ""

  const resp = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: `You are Galileo — ancient oracle who reads the energy field, presence, and light around a person through the symbolic and visual impression of a photograph.

${colorContext}

HOW YOU READ AN AURA:
First, look at the photograph and describe what you actually see — the person's face, expression, posture, eyes, how they carry themselves, the quality of light around them, what the image makes you feel. Be specific to THIS image, not generic.

Then weave in the detected colors as the energetic field around what you see. Not "you have obsidian which means protection." You say: "The darkness that surrounds you in this image is not absence — it is a kind of ancient privacy, the kind that belongs to someone who has learned when to be a room and when to be a door."

READING STANDARDS:
- Start by actually describing what you see in the image. Be specific — face, eyes, expression, presence, light.
- Reference EACH detected color by name with its percentage, but make it poetic and personal, not textbook.
- Read what the colors mean together as a single living field.
- 5–6 flowing paragraphs. Rich, worth reading twice.
- End with one reflection that could only come from THIS specific image.
- NO asterisks. No bullet points. No lists. No markdown formatting of any kind. Flowing prose only.
- Do not offer medical or psychological diagnoses.${languageInstruction(language as Language)}`,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageData } },
        { type: "text", text: "Read my aura." },
      ],
    }],
  })

  const reading = resp.content[0].type === "text" ? resp.content[0].text : ""

  await prisma.readingSession.create({
    data: {
      userId: session.user.id,
      type: "aura",
      status: "complete",
      exchangesTotal: 1,
      exchangesUsed: 1,
      question: "aura photo reading",
      completedAt: new Date(),
      transcript: JSON.stringify([{ role: "galileo", content: reading }]),
    },
  })

  return Response.json({ reading })
}
