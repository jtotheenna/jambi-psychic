// Server-side helper: wrap an async handler in a ReadableStream SSE response
export function sseResponse(
  handler: (emit: (type: string, data?: object) => void) => Promise<void>
): Response {
  const enc = new TextEncoder()
  return new Response(
    new ReadableStream({
      async start(ctrl) {
        const emit = (type: string, data: object = {}) =>
          ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`))
        try {
          await handler(emit)
        } catch (err) {
          console.error("SSE handler error:", err)
          emit("error", { message: "Something stirred in the void." })
        }
        ctrl.close()
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        Connection: "keep-alive",
      },
    }
  )
}

// Stream an Anthropic message and emit deltas. Returns the full accumulated text.
export async function streamClaude(
  emit: (type: string, data?: object) => void,
  params: {
    model: string
    max_tokens: number
    system?: string
    messages: { role: "user" | "assistant"; content: unknown }[]
  }
): Promise<string> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk")
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  let text = ""
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = (client.messages as any).stream(params)
  for await (const ev of stream) {
    if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
      text += ev.delta.text
      emit("delta", { text: ev.delta.text })
    }
  }
  return text
}
