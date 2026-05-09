"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import GalileoPanel from "@/components/GalileoPanel"
import { useGalileoVoice } from "@/lib/useGalileoVoice"
import { getStoredLanguage } from "@/lib/language"
import LanguageSelector from "@/components/LanguageSelector"
import { audioBlobToPCM } from "@/components/FloatingSimli"
import type { NatalChart, PlanetPos } from "@/lib/astroCalc"

const PLANET_SYMBOLS: Record<string, string> = {
  sun: "☉", moon: "☽", rising: "↑", mercury: "☿", venus: "♀",
  mars: "♂", jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆",
  pluto: "♇", northNode: "☊",
}
const PLANET_LABELS: Record<string, string> = {
  sun: "Sun", moon: "Moon", rising: "Rising", mercury: "Mercury", venus: "Venus",
  mars: "Mars", jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus",
  neptune: "Neptune", pluto: "Pluto", northNode: "North Node",
}
const PLANET_ORDER = ["sun", "moon", "rising", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "northNode"]

const SIGN_COLOR: Record<string, string> = {
  Aries: "#ef4444", Taurus: "#22c55e", Gemini: "#eab308", Cancer: "#a5b4fc",
  Leo: "#f97316", Virgo: "#84cc16", Libra: "#ec4899", Scorpio: "#8b5cf6",
  Sagittarius: "#06b6d4", Capricorn: "#78716c", Aquarius: "#38bdf8", Pisces: "#c084fc",
}

function ChartWheel({ chart }: { chart: NatalChart }) {
  const planets = PLANET_ORDER.filter(k => k !== "rising" && k !== "northNode")

  return (
    <div style={{ padding: "20px 16px", borderRadius: 12, border: "1px solid rgba(201,168,76,0.2)", background: "rgba(10,5,32,0.6)", backdropFilter: "blur(8px)" }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.25em", color: "#7a8ba8", marginBottom: 16, textAlign: "center" }}>
        ✦ NATAL CHART
      </div>

      {/* Planet grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px 24px", marginBottom: 20 }}>
        {PLANET_ORDER.map(key => {
          const pos = chart[key as keyof NatalChart] as PlanetPos
          if (!pos || typeof pos !== "object" || !("sign" in pos)) return null
          const color = SIGN_COLOR[pos.sign] ?? "#a5b4fc"
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, width: 18, textAlign: "center", opacity: 0.7 }}>{PLANET_SYMBOLS[key]}</span>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.1em", color: "#7a8ba8", width: 70 }}>
                {PLANET_LABELS[key].toUpperCase()}
              </span>
              <span style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color }}>
                {Math.floor(pos.degree)}° {pos.sign}
              </span>
            </div>
          )
        })}
      </div>

      {/* Aspects */}
      {chart.aspects.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(42,26,85,0.5)", paddingTop: 14 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.2em", color: "#4a3870", marginBottom: 10 }}>MAJOR ASPECTS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {chart.aspects.slice(0, 10).map((a, i) => (
              <span key={i} style={{
                fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.08em",
                padding: "3px 8px", borderRadius: 20,
                color: a.type === "trine" ? "#22c55e" : a.type === "opposition" ? "#ef4444" : a.type === "square" ? "#f97316" : a.type === "conjunction" ? "#a5b4fc" : "#c9a84c",
                background: "rgba(42,26,85,0.3)",
                border: "1px solid rgba(42,26,85,0.6)",
              }}>
                {a.planet1} {a.type} {a.planet2}
              </span>
            ))}
          </div>
        </div>
      )}

      {chart.chartPattern && (
        <div style={{ marginTop: 12, fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em", color: "#c9a84c", textAlign: "center" }}>
          ✦ {chart.chartPattern.toUpperCase()}
        </div>
      )}
    </div>
  )
}

export default function AstrologyPage() {
  const [name, setName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [birthTime, setBirthTime] = useState("")
  const [birthCity, setBirthCity] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [reading, setReading] = useState("")
  const [chart, setChart] = useState<NatalChart | null>(null)
  const [error, setError] = useState("")
  const simliSendRef = useRef<((pcm: Uint8Array) => void) | null>(null)
  const voice = useGalileoVoice()
  const language = typeof window !== "undefined" ? getStoredLanguage() : "en"

  const speakWithSimli = useCallback(async (text: string) => {
    voice.setAvatarState("speaking")
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (res.ok && res.status !== 204) {
        const blob = await res.blob()
        if (simliSendRef.current) {
          try {
            const pcm = await audioBlobToPCM(blob)
            simliSendRef.current(pcm)
            const durationMs = Math.max((pcm.length / 32000) * 1000 + 1500, 2000)
            await new Promise<void>(r => setTimeout(r, durationMs))
          } catch {
            const src = URL.createObjectURL(blob)
            await new Promise<void>((resolve) => {
              const audio = new Audio(src)
              audio.onended = () => { URL.revokeObjectURL(src); resolve() }
              audio.onerror  = () => { URL.revokeObjectURL(src); resolve() }
              audio.play().catch(() => resolve())
            })
          }
        } else {
          const src = URL.createObjectURL(blob)
          await new Promise<void>((resolve) => {
            const audio = new Audio(src)
            audio.onended = () => { URL.revokeObjectURL(src); resolve() }
            audio.onerror  = () => { URL.revokeObjectURL(src); resolve() }
            audio.play().catch(() => resolve())
          })
        }
      }
    } catch { /* silent */ }
    voice.setAvatarState("idle")
  }, [voice])

  async function generateChart() {
    if (!name.trim() || !birthDate || !birthCity.trim()) {
      setError("Name, birth date, and birth city are required.")
      return
    }
    setError("")

    const silentAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    silentAudio.volume = 0
    silentAudio.play().catch(() => {})

    setHasStarted(true)
    setLoading(true)
    voice.setAvatarState("thinking")

    const res = await fetch("/api/astrology", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), birthDate, birthTime: birthTime || null, birthCity: birthCity.trim(), language }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Something went wrong.")
      setLoading(false)
      voice.setAvatarState("idle")
      return
    }

    setReading(data.reading)
    setChart(data.chart)
    setLoading(false)

    // Speak the first paragraph
    const hook = data.reading.slice(0, 320).replace(/\s\S+$/, "…")
    await speakWithSimli(hook)
  }

  const canSubmit = name.trim() && birthDate && birthCity.trim() && !loading

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      {/* Nav */}
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(42,26,85,0.5)" }}>
        <Link href="/dashboard" style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7a8ba8", textDecoration: "none" }}>← RETURN</Link>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#c9a84c" }}>✦ NATAL CHART</div>
        <LanguageSelector compact />
      </div>

      {/* Galileo — sticky at top */}
      <div style={{ display: "flex", justifyContent: "center", position: "sticky", top: 57, zIndex: 30, background: "rgba(4,2,14,0.93)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(42,26,85,0.4)", padding: "10px 0" }}>
        <GalileoPanel
          avatarState={hasStarted ? voice.avatarState : "closed"}
          hasStarted={hasStarted}
          mode={voice.mode}
          setMode={voice.setMode}
          isListening={voice.isListening}
          interimTranscript={voice.interimTranscript}
          voiceSupported={voice.voiceSupported}
        />
      </div>

      <div style={{ flex: 1, maxWidth: 760, width: "100%", margin: "0 auto", padding: "28px 16px 48px", display: "flex", flexDirection: "column", gap: 24 }}>

        {!hasStarted && (
          <>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: "#c8d4e8", fontStyle: "italic", textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
              The sky remembers exactly where every planet stood at the moment you arrived. Enter your birth details and Galileo will read your complete natal chart.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480, margin: "0 auto", width: "100%" }}>
              {/* Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#7a8ba8" }}>FULL NAME</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  style={{ background: "rgba(10,5,32,0.6)", border: "1px solid rgba(42,26,85,0.7)", borderRadius: 8, padding: "12px 16px", color: "#ddd8f0", fontFamily: "'EB Garamond', serif", fontSize: 17, outline: "none", width: "100%" }}
                />
              </div>

              {/* Birth date */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#7a8ba8" }}>DATE OF BIRTH</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  style={{ background: "rgba(10,5,32,0.6)", border: "1px solid rgba(42,26,85,0.7)", borderRadius: 8, padding: "12px 16px", color: "#ddd8f0", fontFamily: "'EB Garamond', serif", fontSize: 17, outline: "none", width: "100%", colorScheme: "dark" }}
                />
              </div>

              {/* Birth time */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#7a8ba8" }}>
                  TIME OF BIRTH <span style={{ color: "#4a3870" }}>(optional — needed for accurate Rising sign)</span>
                </label>
                <input
                  type="time"
                  value={birthTime}
                  onChange={e => setBirthTime(e.target.value)}
                  style={{ background: "rgba(10,5,32,0.6)", border: "1px solid rgba(42,26,85,0.7)", borderRadius: 8, padding: "12px 16px", color: "#ddd8f0", fontFamily: "'EB Garamond', serif", fontSize: 17, outline: "none", width: "100%", colorScheme: "dark" }}
                />
              </div>

              {/* Birth city */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#7a8ba8" }}>CITY OF BIRTH</label>
                <input
                  value={birthCity}
                  onChange={e => setBirthCity(e.target.value)}
                  placeholder="e.g. Nashville, TN"
                  style={{ background: "rgba(10,5,32,0.6)", border: "1px solid rgba(42,26,85,0.7)", borderRadius: 8, padding: "12px 16px", color: "#ddd8f0", fontFamily: "'EB Garamond', serif", fontSize: 17, outline: "none", width: "100%" }}
                />
              </div>

              {error && (
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#be123c" }}>{error}</div>
              )}

              <button
                onClick={generateChart}
                disabled={!canSubmit}
                style={{ marginTop: 8, padding: "16px 0", borderRadius: 8, border: "1px solid rgba(201,168,76,0.5)", background: canSubmit ? "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(79,70,229,0.15))" : "rgba(42,26,85,0.3)", color: canSubmit ? "#c9a84c" : "#4a3870", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", cursor: canSubmit ? "pointer" : "not-allowed" }}
              >
                READ MY CHART ✦
              </button>
            </div>
          </>
        )}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "32px 0" }}>
            <div style={{ display: "flex", gap: 8 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#c9a84c", animation: "moonPulse 1.2s ease-in-out infinite", animationDelay: `${i*0.3}s` }} />
              ))}
            </div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#4a3870" }}>
              GALILEO IS READING THE SKY…
            </div>
          </div>
        )}

        {chart && !loading && (
          <ChartWheel chart={chart} />
        )}

        {reading && !loading && (
          <div style={{ padding: "32px", borderRadius: 12, border: "1px solid rgba(201,168,76,0.15)", background: "linear-gradient(135deg, rgba(26,13,63,0.9), rgba(10,5,32,0.9))", backdropFilter: "blur(8px)" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.25em", color: "#7a8ba8", marginBottom: 20 }}>
              ✦ NATAL CHART READING — {name.toUpperCase()}
            </div>
            {reading.split("\n\n").map((para, i) => (
              <p key={i} style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, lineHeight: 1.9, color: "#ddd8f0", marginBottom: i < reading.split("\n\n").length - 1 ? 22 : 0 }}>
                {para}
              </p>
            ))}
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <Link href="/dashboard" style={{ padding: "10px 28px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.06)", color: "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", textDecoration: "none" }}>
                RETURN ✦
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
