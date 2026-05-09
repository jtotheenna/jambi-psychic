"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { useGalileoVoice } from "@/lib/useGalileoVoice"
import { getStoredLanguage } from "@/lib/language"
import { speakStreaming } from "@/lib/speak"
import GalileoPanel from "@/components/GalileoPanel"

export default function GuidePage() {
  const [context, setContext] = useState("")
  const [reading, setReading] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const simliSendRef = useRef<((pcm: Uint8Array) => void) | null>(null)
  const voice = useGalileoVoice()
  const language = typeof window !== "undefined" ? getStoredLanguage() : "en"

  async function receiveMessage() {
    const sa = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    sa.volume = 0; sa.play().catch(() => {})

    setHasStarted(true)
    setLoading(true)
    voice.setAvatarState("thinking")

    const res = await fetch("/api/guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: context.trim() || undefined, language }),
    })
    const data = await res.json()
    if (!res.ok) { setLoading(false); voice.setAvatarState("idle"); return }

    setReading(data.reading)
    setIsComplete(true)
    setLoading(false)
    voice.setAvatarState("speaking")
    await speakStreaming(data.reading, simliSendRef.current)
    voice.setAvatarState("idle")
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(42,26,85,0.5)" }}>
        <Link href="/dashboard" style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7a8ba8", textDecoration: "none" }}>← RETURN</Link>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7c3aed" }}>🕯 GUIDE MESSAGE</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ flex: 1, maxWidth: 620, width: "100%", margin: "0 auto", padding: "32px 16px", display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GalileoPanel
            avatarState={hasStarted ? voice.avatarState : "closed"}
            hasStarted={hasStarted}
            mode={voice.mode}
            setMode={voice.setMode}
            isListening={voice.isListening}
            interimTranscript={voice.interimTranscript}
            voiceSupported={voice.voiceSupported}
            onSendAudio={(fn) => { simliSendRef.current = fn }}
          />
        </div>

        {!hasStarted && (
          <div style={{ width: "100%", maxWidth: 500, display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: "#8878a8", fontStyle: "italic", textAlign: "center", lineHeight: 1.75 }}>
              No question is needed. Receive the message that is waiting for this moment.
            </p>
            <div style={{ width: "100%", borderRadius: 10, border: "1px solid rgba(124,58,237,0.2)", background: "rgba(10,5,32,0.5)", padding: "4px" }}>
              <div style={{ padding: "10px 16px 4px", fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.2em", color: "#4a3870" }}>
                OPTIONAL — what has been on your mind?
              </div>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="Leave blank, or share a word or feeling…"
                rows={3}
                style={{ width: "100%", background: "transparent", border: "none", padding: "8px 16px 14px", color: "#ddd8f0", fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.6, resize: "none", outline: "none" }}
              />
            </div>
            <button
              onClick={receiveMessage}
              disabled={loading}
              style={{ width: "100%", padding: "16px", borderRadius: 8, border: "1px solid rgba(124,58,237,0.5)", background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.15))", color: "#a78bfa", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", cursor: "pointer" }}
            >
              RECEIVE YOUR MESSAGE ✦
            </button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#a78bfa", animation: "moonPulse 1.2s ease-in-out infinite", animationDelay: `${i*0.3}s` }} />
              ))}
            </div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#4a3870", fontStyle: "italic" }}>The message is forming…</p>
          </div>
        )}

        {reading && isComplete && (
          <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp 0.6s ease-out forwards" }}>
            <div style={{ padding: "28px 32px", borderRadius: 12, border: "1px solid rgba(124,58,237,0.2)", background: "linear-gradient(135deg, rgba(26,13,63,0.92), rgba(10,5,32,0.95))", backdropFilter: "blur(8px)" }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.25em", color: "#7a8ba8", marginBottom: 20 }}>🕯 YOUR MESSAGE</div>
              {reading.split("\n\n").map((para, i) => (
                <p key={i} style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, lineHeight: 1.9, color: "#ddd8f0", marginBottom: i < reading.split("\n\n").length - 1 ? 20 : 0 }}>
                  {para}
                </p>
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              <Link href="/dashboard" style={{ padding: "10px 28px", borderRadius: 8, border: "1px solid rgba(124,58,237,0.35)", background: "rgba(124,58,237,0.08)", color: "#a78bfa", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", textDecoration: "none" }}>
                RETURN ✦
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
