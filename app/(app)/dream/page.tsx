"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useGalileoVoice } from "@/lib/useGalileoVoice"
import { speakStreaming } from "@/lib/speak"
import { playBoxOpen, playSessionEnd } from "@/lib/sounds"
import GalileoPanel from "@/components/GalileoPanel"

const SpeechRecognition = typeof window !== "undefined"
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null

export default function DreamPage() {
  const [dream, setDream] = useState("")
  const [reading, setReading] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [micSupported, setMicSupported] = useState(false)
  const recognitionRef = useRef<InstanceType<NonNullable<typeof SpeechRecognition>> | null>(null)
  const simliSendRef = useRef<((pcm: Uint8Array) => void) | null>(null)
  const voice = useGalileoVoice()
  const language = "en"
  useEffect(() => { voice.open(); setMicSupported(!!SpeechRecognition) }, []) // eslint-disable-line

  function startListening() {
    if (!SpeechRecognition || isListening) return
    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(" ")
      setDream(prev => prev ? `${prev} ${transcript}` : transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
  }

  function stopListening() { recognitionRef.current?.stop() }

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
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Mic status */}
              {isListening && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8, background: "rgba(165,180,252,0.1)", border: "1px solid rgba(165,180,252,0.3)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a5b4fc", animation: "moonPulse 0.8s ease-in-out infinite" }} />
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em", color: "#a5b4fc" }}>LISTENING — speak your dream…</span>
                  <button onClick={stopListening} style={{ marginLeft: "auto", fontFamily: "'Cinzel', serif", fontSize: 8, color: "#7a8ba8", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.1em" }}>STOP</button>
                </div>
              )}

              <div style={{ position: "relative" }}>
                <textarea
                  value={dream}
                  onChange={e => setDream(e.target.value)}
                  placeholder={isListening ? "Listening…" : "I was in a house I didn't recognize, and there was water coming in from somewhere I couldn't find…"}
                  rows={8}
                  style={{ width: "100%", background: "rgba(10,5,32,0.7)", border: `1px solid ${isListening ? "rgba(165,180,252,0.4)" : "rgba(165,180,252,0.2)"}`, borderRadius: 10, padding: "18px 20px", paddingRight: micSupported ? "56px" : "20px", color: "#ddd8f0", fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.7, resize: "vertical", outline: "none", transition: "border-color 0.2s" }}
                />
                {/* Mic button inside textarea corner */}
                {micSupported && (
                  <button
                    onMouseDown={startListening}
                    onMouseUp={stopListening}
                    onTouchStart={startListening}
                    onTouchEnd={stopListening}
                    title="Hold to speak your dream"
                    style={{
                      position: "absolute", top: 14, right: 14,
                      width: 36, height: 36, borderRadius: "50%",
                      border: `1px solid ${isListening ? "rgba(165,180,252,0.8)" : "rgba(42,26,85,0.8)"}`,
                      background: isListening ? "rgba(79,70,229,0.3)" : "rgba(26,13,63,0.7)",
                      color: isListening ? "#a5b4fc" : "#4a3870",
                      fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: isListening ? "0 0 12px rgba(165,180,252,0.4)" : "none",
                      transition: "all 0.2s ease",
                    }}
                  >🎙</button>
                )}
              </div>

              {micSupported && (
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.12em", color: "#2a1a55", textAlign: "center" }}>
                  HOLD THE MIC TO SPEAK YOUR DREAM · OR TYPE BELOW
                </p>
              )}

              <button
                onClick={submitDream}
                disabled={!dream.trim() || loading}
                style={{ padding: "14px", borderRadius: 8, border: "1px solid rgba(165,180,252,0.35)", background: dream.trim() ? "linear-gradient(135deg, rgba(79,70,229,0.18), rgba(124,58,237,0.18))" : "rgba(42,26,85,0.3)", color: dream.trim() ? "#a5b4fc" : "#4a3870", fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.2em", cursor: dream.trim() ? "pointer" : "not-allowed" }}
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
