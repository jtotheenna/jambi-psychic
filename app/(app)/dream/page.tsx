"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useGalileoVoice } from "@/lib/useGalileoVoice"
import { speakStreaming } from "@/lib/speak"
import { playBoxOpen, playSessionEnd } from "@/lib/sounds"
import GalileoPanel from "@/components/GalileoPanel"

export default function DreamPage() {
  const [dream, setDream] = useState("")
  const [reading, setReading] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const simliSendRef = useRef<((pcm: Uint8Array) => void) | null>(null)
  const voice = useGalileoVoice()
  const language = "en"
  useEffect(() => { voice.open() }, []) // eslint-disable-line

  async function submitDream() {
    if (!dream.trim() || loading) return
    const sa = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    sa.volume = 0; sa.play().catch(() => {})
    playBoxOpen()
    setHasStarted(true)
    setLoading(true)
    voice.setAvatarState("thinking")

    const res = await fetch("/api/dream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dream, language }),
    })
    const data = await res.json()
    if (!res.ok) { setLoading(false); voice.setAvatarState("idle"); return }

    setReading(data.reading)
    setIsComplete(true)
    setLoading(false)
    playSessionEnd()
    voice.setAvatarState("speaking")
    await speakStreaming(data.reading, simliSendRef.current)
    voice.setAvatarState("idle")
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(42,26,85,0.5)" }}>
        <Link href="/dashboard" style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7a8ba8", textDecoration: "none" }}>← RETURN</Link>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#a5b4fc" }}>☁ DREAM INTERPRETATION</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ flex: 1, maxWidth: 680, width: "100%", margin: "0 auto", padding: "32px 16px", display: "flex", flexDirection: "column", gap: 24 }}>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GalileoPanel
            avatarState={voice.avatarState}
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
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: "#8878a8", fontStyle: "italic", textAlign: "center", lineHeight: 1.75, maxWidth: 520, margin: "0 auto" }}>
              Describe the dream as fully as you can — the people, the places, the feeling, what stayed with you when you woke.
            </p>
            <div>
              <textarea
                value={dream}
                onChange={e => setDream(e.target.value)}
                placeholder="I was in a house I didn't recognize, and there was water coming in from somewhere I couldn't find…"
                rows={8}
                style={{ width: "100%", background: "rgba(10,5,32,0.7)", border: "1px solid rgba(165,180,252,0.2)", borderRadius: 10, padding: "18px 20px", color: "#ddd8f0", fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.7, resize: "vertical", outline: "none" }}
              />
              <button
                onClick={submitDream}
                disabled={!dream.trim() || loading}
                style={{ marginTop: 14, width: "100%", padding: "14px", borderRadius: 8, border: "1px solid rgba(165,180,252,0.35)", background: dream.trim() ? "linear-gradient(135deg, rgba(79,70,229,0.18), rgba(124,58,237,0.18))" : "rgba(42,26,85,0.3)", color: dream.trim() ? "#a5b4fc" : "#4a3870", fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.2em", cursor: dream.trim() ? "pointer" : "not-allowed" }}
              >
                READ THIS DREAM ✦
              </button>
            </div>
          </>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#a5b4fc", animation: "moonPulse 1.2s ease-in-out infinite", animationDelay: `${i*0.3}s` }} />
              ))}
            </div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#4a3870", fontStyle: "italic" }}>Galileo is reading the symbols…</p>
          </div>
        )}

        {reading && isComplete && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp 0.6s ease-out forwards" }}>
            <div style={{ padding: "28px 32px", borderRadius: 12, border: "1px solid rgba(165,180,252,0.15)", background: "linear-gradient(135deg, rgba(26,13,63,0.92), rgba(10,5,32,0.95))", backdropFilter: "blur(8px)" }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.25em", color: "#7a8ba8", marginBottom: 20 }}>☁ YOUR DREAM READING</div>
              {reading.split("\n\n").map((para, i) => (
                <p key={i} style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, lineHeight: 1.9, color: "#ddd8f0", marginBottom: i < reading.split("\n\n").length - 1 ? 20 : 0 }}>
                  {para}
                </p>
              ))}
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
