import { auth } from "@/lib/auth"
import { textToSpeech } from "@/lib/elevenlabs"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return new Response("Unauthorized", { status: 401 })

  const { text } = await req.json()
  if (!text?.trim()) return new Response("No text provided", { status: 400 })

  const stream = await textToSpeech(text)
  if (!stream) return new Response(null, { status: 204 })

  return new Response(stream, {
    headers: { "Content-Type": "audio/mpeg" },
  })
}
