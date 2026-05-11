// Shared AudioContext — keeps iOS from suspending between sentences
let _sharedCtx: AudioContext | null = null
function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!_sharedCtx || _sharedCtx.state === "closed") {
    try { _sharedCtx = new AudioContext() } catch { return null }
  }
  return _sharedCtx
}

let _currentSource: AudioBufferSourceNode | null = null
let _currentFallbackAudio: HTMLAudioElement | null = null
let _paused = false

export function stopSpeaking() {
  _paused = true
  try { _currentSource?.stop(0); _currentSource = null } catch { /* ignore */ }
  try {
    if (_currentFallbackAudio) {
      _currentFallbackAudio.pause()
      _currentFallbackAudio.src = ""
      _currentFallbackAudio = null
    }
  } catch { /* ignore */ }
}

export function resumeSpeaking() {
  _paused = false
}

export async function speakStreaming(text: string): Promise<void> {
  if (_paused) return

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
  if (!totalBytes || _paused) return

  const all = new Uint8Array(totalBytes)
  let off = 0
  for (const c of chunks) { all.set(c, off); off += c.byteLength }

  // Try Web Audio first — shared context survives between sentences on iOS
  const mp3Buffer = all.buffer.slice(all.byteOffset, all.byteOffset + all.byteLength) as ArrayBuffer
  try {
    const ctx = getAudioCtx()
    if (!ctx) throw new Error("no ctx")
    try { await ctx.resume() } catch { /* ignore */ }
    if (ctx.state !== "running") throw new Error("suspended")

    const decoded = await ctx.decodeAudioData(mp3Buffer)
    const source = ctx.createBufferSource()
    source.buffer = decoded
    source.connect(ctx.destination)
    _currentSource = source

    await new Promise<void>(resolve => {
      source.onended = () => { if (_currentSource === source) _currentSource = null; resolve() }
      source.start(0)
    })
    return
  } catch { /* fall through */ }

  // Fallback — plain Audio element
  if (_paused) return
  const blob = new Blob([all], { type: "audio/mpeg" })
  const src  = URL.createObjectURL(blob)
  await new Promise<void>(resolve => {
    const audio = new Audio(src)
    _currentFallbackAudio = audio
    const done = () => { URL.revokeObjectURL(src); if (_currentFallbackAudio === audio) _currentFallbackAudio = null; resolve() }
    audio.onended = done
    audio.onerror = done
    audio.play().catch(done)
  })
}
