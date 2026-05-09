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
- Every color carries meaning. You do not say "red means energy" flatly — you describe what the specific shade and placement says about this person right now.
- You read where the energy is concentrated (upper body, eyes, hands) and what that says.
- You read the mood, the emotional impression, the quality of light around them.
- You notice what color is dominant and what it is protecting or expressing.
- You are specific. Not "you have a lot of violet, which means spirituality." You say: "Violet at this intensity, in this kind of light, belongs to someone in the middle of a transformation they haven't announced yet."

READING STANDARDS:
- Reference the actual detected colors by name. Be specific about each one.
- Read what the colors mean together as a field, not just one at a time.
- 5–7 paragraphs. Rich, spoken. Worth sitting with.
- End with one reflection — something only this specific field could say.
- No bullet points. No lists. No asterisks. Flowing prose.
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
