// Shared AudioContext — reused across all TTS calls so iOS doesn't suspend between sentences
let _sharedCtx: AudioContext | null = null
function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!_sharedCtx || _sharedCtx.state === "closed") {
    try { _sharedCtx = new AudioContext() } catch { return null }
  }
  return _sharedCtx
}

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
  }
  if (!totalBytes) return

  const all = new Uint8Array(totalBytes)
  let off = 0
  for (const c of chunks) { all.set(c, off); off += c.byteLength }
  const mp3Buffer = all.buffer.slice(all.byteOffset, all.byteOffset + all.byteLength) as ArrayBuffer

  if (sendToSimli) {
    try {
      const ctx = getAudioCtx()
      if (!ctx) throw new Error("No AudioContext")
      try { await ctx.resume() } catch { /* ignore */ }

      // If context still isn't running after resume, bail to plain Audio element
      if (ctx.state !== "running") {
        throw new Error("AudioContext suspended")
      }

      const decoded = await ctx.decodeAudioData(mp3Buffer)
      const source = ctx.createBufferSource()
      source.buffer = decoded

      // ScriptProcessorNode captures audio AS it plays and sends to Simli immediately.
      // This is frame-perfect: same samples that hit the speaker go to Simli with zero delay.
      const nativeRate = ctx.sampleRate        // e.g. 44100 or 48000
      const simliRate  = 16000
      const bufSize    = 4096                  // samples per frame at native rate

      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const processor = ctx.createScriptProcessor(bufSize, 1, 1)

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        const native = e.inputBuffer.getChannelData(0)  // float32 at native rate
        // Downsample to 16kHz for Simli using linear interpolation
        const outLen = Math.round(native.length * simliRate / nativeRate)
        const i16 = new Int16Array(outLen)
        for (let i = 0; i < outLen; i++) {
          const pos = i * nativeRate / simliRate
          const lo  = Math.floor(pos), hi = Math.min(lo + 1, native.length - 1)
          const frac = pos - lo
          const sample = native[lo] * (1 - frac) + native[hi] * frac
          i16[i] = Math.max(-32768, Math.min(32767, sample * 32768))
        }
        sendToSimli!(new Uint8Array(i16.buffer))
      }

      // source → processor → speakers
      // processor.onaudioprocess fires for every frame going to speakers — perfect sync
      source.connect(processor)
      processor.connect(ctx.destination)

      await new Promise<void>(resolve => {
        source.onended = () => {
          processor.disconnect()
          // Don't close the shared context — it stays alive for the next sentence
          resolve()
        }
        source.start(0)
      })
      return
    } catch {
      // Web Audio failed — fall through to plain MP3 playback
    }
  }

  // No Simli or Web Audio unavailable — plain MP3 via Audio element
  const blob = new Blob([all], { type: "audio/mpeg" })
  const src  = URL.createObjectURL(blob)
  await new Promise<void>(resolve => {
    const audio = new Audio(src)
    audio.onended = () => { URL.revokeObjectURL(src); resolve() }
    audio.onerror = () => { URL.revokeObjectURL(src); resolve() }
    audio.play().catch(() => { URL.revokeObjectURL(src); resolve() })
  })
}
