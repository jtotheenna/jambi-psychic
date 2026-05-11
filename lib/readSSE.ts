// Throttle a state-setter to at most one call per animation frame.
// Prevents rapid streaming deltas from causing layout thrashing / seizure effect on mobile.
export function rafThrottle<T>(setter: (v: T) => void): (v: T) => void {
  let pending: T | undefined
  let queued = false
  return (v: T) => {
    pending = v
    if (!queued) {
      queued = true
      requestAnimationFrame(() => { setter(pending!); queued = false })
    }
  }
}

// Find the next sentence boundary after index 14 (avoids splitting short fragments)
export function nextBoundary(text: string): number {
  // Paragraph break takes priority
  const para = text.indexOf("\n\n", 10)
  if (para !== -1) return para + 2

  // Sentence-ending punctuation followed by whitespace
  for (let i = 14; i < text.length - 1; i++) {
    if (".!?".includes(text[i]) && /\s/.test(text[i + 1])) return i + 2
  }
  return -1
}

// Parse an SSE ReadableStream, calling onEvent for each complete event.
export async function readSSE(
  body: ReadableStream<Uint8Array>,
  onEvent: (data: Record<string, unknown>) => void
) {
  const reader = body.getReader()
  const dec = new TextDecoder()
  let buf = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const events = buf.split("\n\n")
    buf = events.pop() ?? ""
    for (const ev of events) {
      const line = ev.split("\n").find(l => l.startsWith("data: "))
      if (!line) continue
      try { onEvent(JSON.parse(line.slice(6))) } catch { /* skip malformed */ }
    }
  }
  // Flush any remaining buffer
  if (buf.startsWith("data: ")) {
    try { onEvent(JSON.parse(buf.slice(6))) } catch { /* skip */ }
  }
}
