import { textToSpeech } from "@/lib/elevenlabs"

// Allowed demo clips only — no auth required but no free-form TTS
const ALLOWED = new Set([
  `The cards have been waiting for you.`,
  `I'm Galileo — an ancient oracle. I give tarot, dream, palm, and love readings. Every word spoken aloud, in real time.`,
  `The Moon. Move forward without knowing where it ends. That discomfort is the path. The cards don't lie.`,
])

export async function POST(req: Request) {
  const { text } = await req.json()
  if (!text?.trim() || !ALLOWED.has(text.trim())) {
    return new Response("Not allowed", { status: 403 })
  }

  const stream = await textToSpeech(text)
  if (!stream) return new Response(null, { status: 204 })

  return new Response(stream, {
    headers: { "Content-Type": "audio/mpeg" },
  })
}
