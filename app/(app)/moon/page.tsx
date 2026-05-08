"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import GalileoPanel from "@/components/GalileoPanel"
import MoonWheel from "@/components/MoonWheel"
import { useGalileoVoice } from "@/lib/useGalileoVoice"
import { getMoonData, type MoonData } from "@/lib/moon"
import { getStoredLanguage } from "@/lib/language"
import LanguageSelector from "@/components/LanguageSelector"

export default function MoonPage() {
  const [moonInfo, setMoonInfo] = useState<MoonData>(() => getMoonData(new Date()))
  const [reading, setReading] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const voice = useGalileoVoice()
  const language = typeof window !== "undefined" ? getStoredLanguage() : "en"
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [reading])

  async function enterReading() {
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
      body: JSON.stringify({ message: "__OPENING__", language }),
    })
    const data = await res.json()
    if (!res.ok) { setLoading(false); voice.setLoading(false); return }

    if (data.moonData) setMoonInfo(data.moonData)
    setReading(data.reading)
    setIsComplete(true)
    voice.setLoading(false)
    setLoading(false)

    // Speak first paragraph immediately so voice starts fast
    const firstPara = data.reading.split("\n\n")[0] || data.reading.slice(0, 400)
    await voice.speak(firstPara)
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      <Link href="/dashboard" style={{ position: "absolute", top: 24, left: 24, fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7a8ba8", textDecoration: "none", zIndex: 2 }}>
        ← RETURN
      </Link>
      <div style={{ position: "absolute", top: 20, right: 16, zIndex: 2 }}>
        <LanguageSelector compact />
      </div>

      {/* Wheel + avatar */}
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

      {/* Enter button */}
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

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "24px 0" }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#a5b4fc", animation: "moonPulse 1.2s ease-in-out infinite", animationDelay: `${i*0.3}s` }} />
          ))}
        </div>
      )}

      {/* Reading */}
      {reading && (
        <div ref={scrollRef} style={{ maxWidth: 680, width: "100%", margin: "0 auto", padding: "0 24px 48px" }}>
          <div style={{ padding: "28px 32px", borderRadius: 12, border: "1px solid rgba(165,180,252,0.15)", background: "linear-gradient(135deg, rgba(26,13,63,0.9), rgba(10,5,32,0.9))", backdropFilter: "blur(8px)" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.25em", color: "#7a8ba8", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span>{moonInfo.phaseEmoji}</span>
              <span>{moonInfo.phase.toUpperCase()} · {moonInfo.sunBearMoon.name.toUpperCase()}</span>
            </div>
            {reading.split("\n\n").map((para, i) => (
              <p key={i} style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, lineHeight: 1.85, color: "#ddd8f0", marginBottom: i < reading.split("\n\n").length - 1 ? 20 : 0 }}>
                {para}
              </p>
            ))}
          </div>

          {isComplete && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <Link href="/dashboard" style={{ padding: "10px 28px", borderRadius: 8, border: "1px solid rgba(165,180,252,0.3)", background: "rgba(165,180,252,0.06)", color: "#a5b4fc", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", textDecoration: "none" }}>
                RETURN ✦
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
