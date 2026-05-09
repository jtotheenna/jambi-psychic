"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { useGalileoVoice } from "@/lib/useGalileoVoice"
import { getStoredLanguage } from "@/lib/language"
import { speakStreaming } from "@/lib/speak"
import GalileoPanel from "@/components/GalileoPanel"

const ANSWER_COLORS: Record<string, string> = {
  YES: "#c9a84c",
  NO: "#be123c",
  PERHAPS: "#a5b4fc",
  "NOT YET": "#f59e0b",
  "LOOK DEEPER": "#7c3aed",
}

export default function YesNoPage() {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState<string | null>(null)
  const [reading, setReading] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const simliSendRef = useRef<((pcm: Uint8Array) => void) | null>(null)
  const voice = useGalileoVoice()
  const language = typeof window !== "undefined" ? getStoredLanguage() : "en"

  async function consult() {
    if (!question.trim() || loading) return
    const sa = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    sa.volume = 0; sa.play().catch(() => {})

    setHasStarted(true)
    setLoading(true)
    voice.setAvatarState("thinking")

    const res = await fetch("/api/yes-no", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, language }),
    })
    const data = await res.json()
    if (!res.ok) { setLoading(false); voice.setAvatarState("idle"); return }

    setAnswer(data.answer)
    setReading(data.reading)
    setLoading(false)
    voice.setAvatarState("speaking")
    await speakStreaming(data.reading, simliSendRef.current)
    voice.setAvatarState("idle")
  }

  const answerColor = answer ? (ANSWER_COLORS[answer] ?? "#c9a84c") : "#c9a84c"

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(42,26,85,0.5)" }}>
        <Link href="/dashboard" style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7a8ba8", textDecoration: "none" }}>← RETURN</Link>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#a5b4fc" }}>☾ YES OR NO ORACLE</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ flex: 1, maxWidth: 600, width: "100%", margin: "0 auto", padding: "32px 16px", display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>

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
          <>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: "#8878a8", fontStyle: "italic", textAlign: "center", maxWidth: 440, lineHeight: 1.7 }}>
              Ask a question that can be answered yes or no. Speak it clearly, with intention.
            </p>
            <div style={{ width: "100%", maxWidth: 480 }}>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); consult() } }}
                placeholder="Your question…"
                rows={3}
                style={{ width: "100%", background: "rgba(10,5,32,0.7)", border: "1px solid rgba(165,180,252,0.25)", borderRadius: 10, padding: "16px 18px", color: "#ddd8f0", fontFamily: "'EB Garamond', serif", fontSize: 18, lineHeight: 1.6, resize: "none", outline: "none" }}
              />
              <button
                onClick={consult}
                disabled={!question.trim() || loading}
                style={{ marginTop: 16, width: "100%", padding: "14px", borderRadius: 8, border: "1px solid rgba(165,180,252,0.4)", background: question.trim() ? "linear-gradient(135deg, rgba(79,70,229,0.2), rgba(124,58,237,0.2))" : "rgba(42,26,85,0.3)", color: question.trim() ? "#a5b4fc" : "#4a3870", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", cursor: question.trim() ? "pointer" : "not-allowed" }}
              >
                CONSULT THE ORACLE ✦
              </button>
            </div>
          </>
        )}

        {loading && (
          <div style={{ display: "flex", gap: 8, padding: "32px 0" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#a5b4fc", animation: "moonPulse 1.2s ease-in-out infinite", animationDelay: `${i*0.3}s` }} />
            ))}
          </div>
        )}

        {answer && !loading && (
          <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp 0.6s ease-out forwards" }}>
            <div style={{ textAlign: "center", padding: "28px 16px", borderRadius: 12, border: `1px solid ${answerColor}40`, background: `linear-gradient(135deg, ${answerColor}12, rgba(10,5,32,0.9))` }}>
              <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: "clamp(32px, 8vw, 52px)", letterSpacing: "0.15em", color: answerColor, textShadow: `0 0 40px ${answerColor}80`, marginBottom: 4 }}>
                {answer}
              </div>
            </div>
            <div style={{ padding: "24px 28px", borderRadius: 12, border: "1px solid rgba(165,180,252,0.15)", background: "linear-gradient(135deg, rgba(26,13,63,0.9), rgba(10,5,32,0.9))", backdropFilter: "blur(8px)" }}>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, lineHeight: 1.85, color: "#ddd8f0", margin: 0 }}>
                {reading}
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <Link href="/dashboard" style={{ padding: "10px 28px", borderRadius: 8, border: "1px solid rgba(165,180,252,0.3)", background: "rgba(165,180,252,0.06)", color: "#a5b4fc", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", textDecoration: "none" }}>
                RETURN ✦
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
