"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import GalileoPanel from "@/components/GalileoPanel"
import { useGalileoVoice } from "@/lib/useGalileoVoice"

function playAudio(src: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(src)
    const done = () => { URL.revokeObjectURL(src); resolve() }
    audio.onended = done; audio.onerror = done
    audio.play().catch(done)
  })
}

async function fetchTTS(text: string): Promise<string | null> {
  try {
    const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) })
    if (!res.ok || res.status === 204) return null
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  } catch { return null }
}

type Message = { role: "user" | "galileo"; content: string }

export default function PalmPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [exchangesUsed, setExchangesUsed] = useState(0)
  const [exchangesTotal] = useState(5)
  const [isComplete, setIsComplete] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasGreeted = useRef(false)
  const voice = useGalileoVoice()

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (hasGreeted.current) return
    hasGreeted.current = true
    voice.open()
    sendMessage("__OPENING__")
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading || isComplete) return
    setInput("")
    setLoading(true)
    voice.setLoading(true)

    if (msg !== "__OPENING__") {
      setMessages((prev) => [...prev, { role: "user", content: msg }])
    }

    const res = await fetch("/api/palm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, sessionId, voiceMode: voice.mode === "conversational" }),
    })

    const data = await res.json()
    if (!res.ok) { setLoading(false); voice.setLoading(false); return }

    if (!sessionId) setSessionId(data.sessionId)
    if (!data.isGreeting) {
      setExchangesUsed(data.exchangesUsed)
      setIsComplete(data.isComplete)
    }
    setMessages((prev) => [...prev, { role: "galileo", content: data.reading }])
    voice.setLoading(false)
    setLoading(false)
    if (voice.mode !== "text") {
      await voice.speak(data.reading)
      if (voice.mode === "conversational" && !data.isComplete) {
        voice.startListening((t) => sendMessage(t))
      }
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(42,26,85,0.5)" }}>
        <Link href="/dashboard" style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7a8ba8", textDecoration: "none" }}>← RETURN</Link>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#4a3870" }}>✋ PALM READING</div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.1em", color: "#4a3870" }}>{exchangesTotal - exchangesUsed} LEFT</div>
      </div>

      <div style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GalileoPanel
            avatarState={voice.avatarState}
            hasStarted={voice.hasStarted}
            mode={voice.mode}
            setMode={voice.setMode}
            isListening={voice.isListening}
            interimTranscript={voice.interimTranscript}
            voiceSupported={voice.voiceSupported}
          />
        </div>

        <div ref={scrollRef} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, maxHeight: "50vh", overflowY: "auto" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: msg.role === "galileo" ? "radial-gradient(circle, #1a0d3f, #0a0520)" : "rgba(42,26,85,0.6)", border: msg.role === "galileo" ? "1px solid rgba(165,180,252,0.4)" : "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                {msg.role === "galileo" ? "☽" : "✦"}
              </div>
              <div style={{ maxWidth: "78%", padding: "14px 18px", borderRadius: msg.role === "galileo" ? "4px 16px 16px 16px" : "16px 4px 16px 16px", background: msg.role === "galileo" ? "linear-gradient(135deg, rgba(26,13,63,0.9), rgba(10,5,32,0.9))" : "rgba(42,26,85,0.5)", border: msg.role === "galileo" ? "1px solid rgba(165,180,252,0.2)" : "1px solid rgba(201,168,76,0.2)", fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.8, color: "#ddd8f0", backdropFilter: "blur(8px)" }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "radial-gradient(circle, #1a0d3f, #0a0520)", border: "1px solid rgba(165,180,252,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>☽</div>
              <div style={{ padding: "14px 18px", borderRadius: "4px 16px 16px 16px", background: "rgba(26,13,63,0.9)", border: "1px solid rgba(165,180,252,0.2)", display: "flex", gap: 6, alignItems: "center" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#a5b4fc", animation: "moonPulse 1.2s ease-in-out infinite", animationDelay: `${i*0.3}s` }} />)}
              </div>
            </div>
          )}
        </div>

        {!isComplete ? (
          <div style={{ padding: 16, background: "rgba(10,5,32,0.6)", borderRadius: 12, border: "1px solid rgba(42,26,85,0.6)", backdropFilter: "blur(8px)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                disabled={loading}
                placeholder="Ask anything..."
                rows={2}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", color: "#ddd8f0", fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.6 }}
              />
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ padding: "10px 20px", borderRadius: 8, height: 40, border: "1px solid rgba(201,168,76,0.4)", background: loading || !input.trim() ? "rgba(42,26,85,0.3)" : "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(79,70,229,0.15))", color: loading || !input.trim() ? "#4a3870" : "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.15em", cursor: loading || !input.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                {loading ? "☽" : "SEND ✦"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 24, borderRadius: 12, border: "1px solid rgba(201,168,76,0.2)", background: "rgba(10,5,32,0.6)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✋</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", color: "#c9a84c", marginBottom: 16 }}>THE READING IS COMPLETE</div>
            <Link href="/dashboard" style={{ padding: "10px 28px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.08)", color: "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", textDecoration: "none" }}>
              RETURN ✦
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
