const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID
// Set ELEVENLABS_ENABLED=false in .env.local to skip TTS during development
const ELEVENLABS_ENABLED = process.env.ELEVENLABS_ENABLED !== "false"

// Standard HTTP TTS — good for short single requests
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
        model_id: "eleven_flash_v2_5",
        output_format: "mp3_44100_128",
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

// WebSocket streaming input — audio starts after ~50 chars, no per-sentence HTTP overhead.
// Returns a ReadableStream of PCM audio, resolves as soon as first audio chunk arrives.
export async function textToSpeechStreamed(text: string): Promise<ReadableStream | null> {
  if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID || !ELEVENLABS_ENABLED) return null

  return new Promise((resolve) => {
    const url =
      `wss://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream-input` +
      `?model_id=eleven_flash_v2_5&output_format=pcm_16000&optimize_streaming_latency=4` +
      `&xi_api_key=${ELEVENLABS_API_KEY}`

    // Node 22 has built-in WebSocket
    const ws = new (globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket(url)

    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
    const writer = writable.getWriter()
    let resolved = false

    const settle = (stream: ReadableStream | null) => {
      if (!resolved) { resolved = true; resolve(stream) }
    }

    ws.onopen = () => {
      // Init message — sets voice settings and tells ElevenLabs to start generating
      // after just 50 chars (lowest possible latency)
      ws.send(JSON.stringify({
        text: " ",
        voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.4, use_speaker_boost: true },
        generation_config: { chunk_length_schedule: [50, 100, 150, 250] },
      }))
      // Send full text in one message
      ws.send(JSON.stringify({ text }))
      // Flush — tells ElevenLabs input is done, generate the rest
      ws.send(JSON.stringify({ text: "" }))
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as { audio?: string; isFinal?: boolean }
        if (msg.audio) {
          const pcm = Buffer.from(msg.audio, "base64")
          settle(readable)
          writer.write(new Uint8Array(pcm))
        }
        if (msg.isFinal) {
          try { writer.close() } catch {}
          ws.close()
        }
      } catch { /* non-JSON frame, ignore */ }
    }

    ws.onerror = () => { try { writer.close() } catch {}; settle(null) }
    ws.onclose = () => { try { writer.close() } catch {}; settle(null) }

    // Fallback if WS doesn't open within 3s
    setTimeout(() => settle(null), 3000)
  })
}
