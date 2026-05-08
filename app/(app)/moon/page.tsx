"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import GalileoPanel from "@/components/GalileoPanel"
import MoonWheel from "@/components/MoonWheel"
import { useGalileoVoice } from "@/lib/useGalileoVoice"
import { getMoonData, type MoonData } from "@/lib/moon"
import { getStoredLanguage } from "@/lib/language"
import LanguageSelector from "@/components/LanguageSelector"

type Message = { role: "user" | "galileo"; content: string }

function ShareMoonButton({ moonInfo, firstReading }: { moonInfo: MoonData; firstReading: string }) {
  const [copied, setCopied] = useState(false)
  function share() {
    const text = `🌙 ${moonInfo.phase} · ${moonInfo.sunBearMoon.name}\n\n${firstReading.substring(0, 200)}...\n\nGet your moon reading at askgalileo.live`
    if (navigator.share) {
      navigator.share({ title: "My Moon Reading with Galileo", text })
    } else {
      navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
    }
  }
  return (
    <button onClick={share} style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em", color: copied ? "#a5b4fc" : "#7a8ba8", background: "none", border: `1px solid ${copied ? "rgba(165,180,252,0.3)" : "rgba(42,26,85,0.5)"}`, borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}>
      {copied ? "COPIED ✦" : "SHARE READING ✦"}
    </button>
  )
}

export default function MoonPage() {
  const [moonInfo, setMoonInfo] = useState<MoonData>(() => getMoonData(new Date()))
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [exchangesUsed, setExchangesUsed] = useState(0)
  const [exchangesTotal] = useState(2)
  const [isComplete, setIsComplete] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const voice = useGalileoVoice()
  const language = typeof window !== "undefined" ? getStoredLanguage() : "en"

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  async function enterReading() {
    // Unlock HTML5 audio for Safari
    const silentAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    silentAudio.volume = 0
    silentAudio.play().catch(() => {})

    setHasEntered(true)
    voice.open()
    setLoading(true)
    voice.setLoading(true)

    const res = await fetch("/api/moon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "__OPENING__", sessionId, language }),
    })
    const data = await res.json()
    if (!res.ok) { setLoading(false); voice.setLoading(false); return }

    if (data.moonData) setMoonInfo(data.moonData)
    if (!sessionId) setSessionId(data.sessionId)
    setMessages([{ role: "galileo", content: data.reading }])
    voice.setLoading(false)
    setLoading(false)
    await voice.speak(data.reading)
  }

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
      body: JSON.stringify({ message: msg, sessionId, voiceMode: voice.mode === "conversational", language }),
    })
    const data = await res.json()
    if (!res.ok) { setLoading(false); voice.setLoading(false); return }

    if (data.moonData) setMoonInfo(data.moonData)
    if (!sessionId) setSessionId(data.sessionId)
    setExchangesUsed(data.exchangesUsed)
    setIsComplete(data.isComplete)
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
      <Link href="/dashboard" style={{ position: "absolute", top: 24, left: 24, fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7a8ba8", textDecoration: "none", zIndex: 2 }}>
        ← RETURN
      </Link>
      <div style={{ position: "absolute", top: 20, right: 16, zIndex: 2 }}>
        <LanguageSelector compact />
      </div>

      {/* Top layout: wheel + avatar */}
      <div style={{ display: "flex", gap: 24, justifyContent: "center", alignItems: "flex-start", padding: "48px 24px 16px", flexWrap: "wrap" }}>
        <div style={{ flexShrink: 0 }}>
          <MoonWheel moonData={moonInfo} />
        </div>
        <div style={{ flexShrink: 0 }}>
          <GalileoPanel
            avatarState={hasEntered ? voice.avatarState : "closed"}
            hasStarted={hasEntered}
            mode={voice.mode}
            setMode={voice.setMode}
            isListening={voice.isListening}
            interimTranscript={voice.interimTranscript}
            voiceSupported={voice.voiceSupported}
          />
        </div>
      </div>

      {/* Enter button — shown before reading starts */}
      {!hasEntered && (
        <div style={{ textAlign: "center", marginTop: 8, marginBottom: 24 }}>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: "#7a8ba8", fontStyle: "italic", marginBottom: 20 }}>
            Tonight's sky is ready.
          </p>
          <button
            onClick={enterReading}
            style={{ padding: "14px 48px", borderRadius: 8, border: "1px solid rgba(165,180,252,0.5)", background: "linear-gradient(135deg, rgba(165,180,252,0.12) 0%, rgba(79,70,229,0.12) 100%)", color: "#a5b4fc", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", cursor: "pointer" }}
          >
            READ THE MOON ☽
          </button>
        </div>
      )}

      {/* Chat */}
      <div style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto", padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div ref={scrollRef} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, maxHeight: "40vh", overflowY: "auto" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: msg.role === "galileo" ? "radial-gradient(circle, #1a0d3f, #0a0520)" : "rgba(42,26,85,0.6)", border: msg.role === "galileo" ? "1px solid rgba(165,180,252,0.4)" : "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                {msg.role === "galileo" ? "☽" : "✦"}
              </div>
              <div style={{ maxWidth: "78%", padding: "14px 18px", borderRadius: msg.role === "galileo" ? "4px 16px 16px 16px" : "16px 4px 16px 16px", background: msg.role === "galileo" ? "linear-gradient(135deg, rgba(26,13,63,0.9) 0%, rgba(10,5,32,0.9) 100%)" : "rgba(42,26,85,0.5)", border: msg.role === "galileo" ? "1px solid rgba(165,180,252,0.2)" : "1px solid rgba(201,168,76,0.2)", fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.8, color: "#ddd8f0", backdropFilter: "blur(8px)" }}>
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

        {sessionId && !isComplete && (
          <div style={{ textAlign: "center", fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em", color: "#4a3870" }}>
            {exchangesTotal - exchangesUsed} QUESTIONS REMAINING
          </div>
        )}

        {messages.length > 0 && (
          <div style={{ textAlign: "center" }}>
            <ShareMoonButton moonInfo={moonInfo} firstReading={messages.find(m => m.role === "galileo")?.content ?? ""} />
          </div>
        )}

        {hasEntered && !isComplete ? (
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
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ padding: "10px 20px", borderRadius: 8, height: 40, border: "1px solid rgba(201,168,76,0.4)", background: loading || !input.trim() ? "rgba(42,26,85,0.3)" : "linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(79,70,229,0.15) 100%)", color: loading || !input.trim() ? "#4a3870" : "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.15em", cursor: loading || !input.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                {loading ? "☽" : "SEND ✦"}
              </button>
            </div>
          </div>
        ) : isComplete ? (
          <div style={{ textAlign: "center", padding: 24, borderRadius: 12, border: "1px solid rgba(201,168,76,0.2)", background: "rgba(10,5,32,0.6)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>☽</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", color: "#c9a84c", marginBottom: 12 }}>THE READING IS COMPLETE</div>
            <Link href="/dashboard" style={{ padding: "10px 28px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.08)", color: "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", textDecoration: "none" }}>
              RETURN ✦
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}
