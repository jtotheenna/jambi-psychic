import { auth } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.email?.toLowerCase().trim() !== (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim()) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { messages, dataContext } = await req.json()

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `You are a sharp growth analyst for Galileo (askgalileo.live), an AI psychic readings app. You have access to the current analytics data below. Answer questions about it directly and specifically. Be concise. No fluff.

CURRENT DATA:
${dataContext}`,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
