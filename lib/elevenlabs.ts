const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID
// Set ELEVENLABS_ENABLED=false in .env.local to skip TTS during development
const ELEVENLABS_ENABLED = process.env.ELEVENLABS_ENABLED !== "false"

export async function textToSpeech(text: string): Promise<ReadableStream | null> {
  if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID || !ELEVENLABS_ENABLED) return null

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    }
  )

  if (!response.ok || !response.body) return null
  return response.body
}
