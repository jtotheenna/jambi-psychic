"use client"

import { useState, useRef, useEffect } from "react"

type Message = { role: "user" | "assistant"; content: string }

export default function AnalyticsChat({ dataContext }: { dataContext: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput("")

    const next: Message[] = [...messages, { role: "user", content: text }]
    setMessages(next)
    setLoading(true)

    const res = await fetch("/api/analytics/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: next, dataContext }),
    })

    if (!res.body) { setLoading(false); return }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let reply = ""
    setMessages(m => [...m, { role: "assistant", content: "" }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      reply += decoder.decode(value, { stream: true })
      setMessages(m => [...m.slice(0, -1), { role: "assistant", content: reply }])
    }

    setLoading(false)
  }

  const s = { fontFamily: "'Cinzel', serif" as const }

  return (
    <div style={{ marginTop: 48, borderRadius: 12, border: "1px solid rgba(124,58,237,0.3)", background: "linear-gradient(135deg, rgba(26,13,63,0.9), rgba(10,5,32,0.95))", overflow: "hidden" }}>
      <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(42,26,85,0.5)" }}>
        <div style={{ ...s, fontSize: 9, letterSpacing: "0.2em", color: "#a5b4fc" }}>✦ ASK YOUR DATA</div>
      </div>

      {messages.length > 0 && (
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20, maxHeight: 480, overflowY: "auto" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ ...s, fontSize: 7, letterSpacing: "0.15em", color: m.role === "user" ? "#c9a84c" : "#a5b4fc" }}>
                {m.role === "user" ? "YOU" : "GALILEO AI"}
              </div>
              <div style={{
                maxWidth: "85%", padding: "12px 18px", borderRadius: 10,
                background: m.role === "user" ? "rgba(201,168,76,0.08)" : "rgba(165,180,252,0.06)",
                border: `1px solid ${m.role === "user" ? "rgba(201,168,76,0.2)" : "rgba(165,180,252,0.15)"}`,
                fontFamily: "'EB Garamond', serif", fontSize: 16, lineHeight: 1.7, color: "#ddd8f0",
                whiteSpace: "pre-wrap",
              }}>
                {m.content}
                {loading && i === messages.length - 1 && m.role === "assistant" && !m.content && (
                  <span style={{ color: "#4a3870" }}>thinking…</span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      <div style={{ padding: "16px 20px", borderTop: messages.length > 0 ? "1px solid rgba(42,26,85,0.5)" : "none", display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask anything about your data…"
          style={{
            flex: 1, padding: "12px 16px", borderRadius: 8,
            border: "1px solid rgba(42,26,85,0.6)", background: "rgba(10,5,32,0.6)",
            color: "#ddd8f0", fontFamily: "'EB Garamond', serif", fontSize: 16,
            outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding: "12px 24px", borderRadius: 8, cursor: loading ? "default" : "pointer",
            border: "1px solid rgba(165,180,252,0.3)", background: "rgba(79,70,229,0.15)",
            color: "#a5b4fc", fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em",
            opacity: loading || !input.trim() ? 0.4 : 1,
          }}
        >
          ASK ✦
        </button>
      </div>
    </div>
  )
}
