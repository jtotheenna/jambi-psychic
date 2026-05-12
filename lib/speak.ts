let _currentAudio: HTMLAudioElement | null = null
let _paused = false

export function stopSpeaking() {
  _paused = true
  try {
    if (_currentAudio) {
      _currentAudio.pause()
      _currentAudio.src = ""
      _currentAudio = null
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

  const blob = new Blob([all], { type: "audio/mpeg" })
  const src = URL.createObjectURL(blob)

  await new Promise<void>(resolve => {
    const audio = new Audio(src)
    _currentAudio = audio
    const done = () => {
      URL.revokeObjectURL(src)
      if (_currentAudio === audio) _currentAudio = null
      resolve()
    }
    audio.onended = done
    audio.onerror = done
    audio.play().catch(done)
  })
}
