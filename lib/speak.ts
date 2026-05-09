// Wrap raw 16kHz 16-bit mono PCM in a WAV header so browsers can play it
function pcmToWav(pcm: Uint8Array, sampleRate = 16000): Blob {
  const numCh = 1, bits = 16
  const byteRate = sampleRate * numCh * (bits / 8)
  const blockAlign = numCh * (bits / 8)
  const buf = new ArrayBuffer(44)
  const v = new DataView(buf)
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  str(0, "RIFF"); v.setUint32(4, 36 + pcm.byteLength, true); str(8, "WAVE")
  str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true)
  v.setUint16(22, numCh, true); v.setUint32(24, sampleRate, true)
  v.setUint32(28, byteRate, true); v.setUint16(32, blockAlign, true)
  v.setUint16(34, bits, true); str(36, "data"); v.setUint32(40, pcm.byteLength, true)
  return new Blob([buf, new Uint8Array(pcm).buffer as ArrayBuffer], { type: "audio/wav" })
}

// Stream PCM from /api/tts → Simli in real time (mouth moves on first chunk).
// Falls back to WAV playback when Simli is not connected.
// Returns when playback is done.
export async function speakStreaming(
  text: string,
  sendToSimli: ((pcm: Uint8Array) => void) | null
): Promise<void> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })
  if (!res.ok || res.status === 204 || !res.body) return

  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value?.byteLength) continue
    chunks.push(value)
    totalBytes += value.byteLength
    if (sendToSimli) sendToSimli(value)
  }

  if (!totalBytes) return

  if (sendToSimli) {
    // Simli handles audio output — wait for estimated playback duration
    const durationMs = Math.max((totalBytes / 32000) * 1000 + 1500, 2000)
    await new Promise(r => setTimeout(r, durationMs))
  } else {
    // No Simli — assemble PCM and play as WAV
    const all = new Uint8Array(totalBytes)
    let offset = 0
    for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.byteLength }
    const src = URL.createObjectURL(pcmToWav(all))
    await new Promise<void>(resolve => {
      const audio = new Audio(src)
      audio.onended  = () => { URL.revokeObjectURL(src); resolve() }
      audio.onerror  = () => { URL.revokeObjectURL(src); resolve() }
      audio.play().catch(() => { URL.revokeObjectURL(src); resolve() })
    })
  }
}
