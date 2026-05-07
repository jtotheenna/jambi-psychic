"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import GalileoPanel from "@/components/GalileoPanel"
import { useGalileoVoice } from "@/lib/useGalileoVoice"

type MoonInfo = {
  phase: string
  illumination: number
  dayOfCycle: number
  phaseEmoji: string
  sunBearMoon: {
    name: string
    totem: string
    element: string
    clan: string
    path: string
    energy: string
    dates: string
  }
}

type Message = { role: "user" | "galileo"; content: string }

export default function MoonPage() {
  const [moonInfo, setMoonInfo] = useState<MoonInfo | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [exchangesUsed, setExchangesUsed] = useState(0)
  const [exchangesTotal] = useState(5)
  const [isComplete, setIsComplete] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const voice = useGalileoVoice()

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading || isComplete) return
    setInput("")
    setLoading(true)
    voice.setLoading(true)
    setMessages((prev) => [...prev, { role: "user", content: msg }])

    const res = await fetch("/api/moon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, sessionId, voiceMode: voice.mode === "conversational" }),
    })

    const data = await res.json()
    if (!res.ok) { setLoading(false); voice.setLoading(false); return }

    if (!moonInfo) { setMoonInfo(data.moonData); voice.open() }
    if (!sessionId) setSessionId(data.sessionId)
    setExchangesUsed(data.exchangesUsed)
    setIsComplete(data.isComplete)
    setMessages((prev) => [...prev, { role: "galileo", content: data.reading }])

    voice.setLoading(false)
    setLoading(false)
    await voice.speak(data.reading)

    if (voice.mode === "conversational" && !data.isComplete) {
      voice.startListening((t) => sendMessage(t))
    }
  }

  const PHASE_COLORS: Record<string, string> = {
    "New Moon": "#1a0d3f",
    "Waxing Crescent": "#2a1a55",
    "First Quarter": "#3a2a70",
    "Waxing Gibbous": "#4a3870",
    "Full Moon": "#c9a84c",
    "Waning Gibbous": "#4a3870",
    "Last Quarter": "#3a2a70",
    "Waning Crescent": "#2a1a55",
  }

  const glowColor = moonInfo?.phase === "Full Moon" ? "rgba(201,168,76,0.6)" : "rgba(165,180,252,0.4)"

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      <Link href="/dashboard" style={{ position: "absolute", top: 24, left: 24, fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7a8ba8", textDecoration: "none" }}>
        ← RETURN
      </Link>

      {/* Avatar + mode selector */}
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 24px 0" }}>
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

      {/* Moon phase display */}
      <div style={{ textAlign: "center", padding: "24px 24px 32px" }}>
        <div style={{
          fontSize: 72,
          marginBottom: 8,
          filter: `drop-shadow(0 0 20px ${glowColor})`,
          animation: "moonPulse 4s ease-in-out infinite",
        }}>
          {moonInfo?.phaseEmoji ?? "☽"}
        </div>

        <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 20, letterSpacing: "0.12em", marginBottom: 4 }} className="text-shimmer">
          {moonInfo?.phase ?? "THE MOON READING"}
        </div>

        {moonInfo && (
          <>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#a5b4fc", marginBottom: 20 }}>
              {moonInfo.illumination}% ILLUMINATED · DAY {moonInfo.dayOfCycle} OF THE CYCLE
            </div>

            {/* Sun Bear moon card */}
            <div style={{
              display: "inline-block",
              padding: "20px 32px",
              borderRadius: 12,
              border: "1px solid rgba(201,168,76,0.25)",
              background: "rgba(10,5,32,0.6)",
              backdropFilter: "blur(8px)",
              textAlign: "center",
              maxWidth: 480,
            }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#c9a84c", marginBottom: 8 }}>
                SUN BEAR MEDICINE WHEEL
              </div>
              <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 16, letterSpacing: "0.1em", color: "#c8d4e8", marginBottom: 4 }}>
                {moonInfo.sunBearMoon.name}
              </div>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#7a8ba8", fontStyle: "italic", marginBottom: 12 }}>
                {moonInfo.sunBearMoon.totem} · {moonInfo.sunBearMoon.clan} · {moonInfo.sunBearMoon.dates}
              </div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.12em", color: "#4a3870" }}>
                {moonInfo.sunBearMoon.path}
              </div>
            </div>
          </>
        )}

        {!moonInfo && (
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: "#7a8ba8", fontStyle: "italic", maxWidth: 400, margin: "16px auto 0" }}>
            Ask Galileo anything. He knows exactly where the moon stands tonight.
          </p>
        )}
      </div>

      {/* Chat */}
      <div style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto", padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, maxHeight: "40vh", overflowY: "auto" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: msg.role === "galileo" ? "radial-gradient(circle, #1a0d3f, #0a0520)" : "rgba(42,26,85,0.6)",
                border: msg.role === "galileo" ? "1px solid rgba(165,180,252,0.4)" : "1px solid rgba(201,168,76,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
              }}>
                {msg.role === "galileo" ? "☽" : "✦"}
              </div>
              <div style={{
                maxWidth: "78%",
                padding: "14px 18px",
                borderRadius: msg.role === "galileo" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                background: msg.role === "galileo"
                  ? "linear-gradient(135deg, rgba(26,13,63,0.9) 0%, rgba(10,5,32,0.9) 100%)"
                  : "rgba(42,26,85,0.5)",
                border: msg.role === "galileo" ? "1px solid rgba(165,180,252,0.2)" : "1px solid rgba(201,168,76,0.2)",
                fontFamily: "'EB Garamond', serif",
                fontSize: 17,
                lineHeight: 1.8,
                color: "#ddd8f0",
                backdropFilter: "blur(8px)",
              }}>
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

        {/* Exchange counter */}
        {sessionId && (
          <div style={{ textAlign: "center", fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em", color: "#4a3870" }}>
            {exchangesTotal - exchangesUsed} EXCHANGES REMAINING
          </div>
        )}

        {/* Input */}
        {!isComplete ? (
          <div style={{ padding: 16, background: "rgba(10,5,32,0.6)", borderRadius: 12, border: "1px solid rgba(42,26,85,0.6)", backdropFilter: "blur(8px)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                disabled={loading}
                placeholder={voice.avatarState === "speaking" ? "Galileo is speaking..." : messages.length === 0 ? "What does the moon hold for you tonight?" : "Ask more..."}
                rows={2}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", color: "#ddd8f0", fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.6 }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                style={{
                  padding: "10px 20px", borderRadius: 8, height: 40,
                  border: "1px solid rgba(201,168,76,0.4)",
                  background: loading || !input.trim() ? "rgba(42,26,85,0.3)" : "linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(79,70,229,0.15) 100%)",
                  color: loading || !input.trim() ? "#4a3870" : "#c9a84c",
                  fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.15em",
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                }}
              >
                {voice.avatarState === "speaking" ? "☽" : "SEND ✦"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 24, borderRadius: 12, border: "1px solid rgba(201,168,76,0.2)", background: "rgba(10,5,32,0.6)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>☽</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", color: "#c9a84c", marginBottom: 12 }}>THE READING IS COMPLETE</div>
            <Link href="/dashboard" style={{ padding: "10px 28px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.08)", color: "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", textDecoration: "none" }}>
              RETURN ✦
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
