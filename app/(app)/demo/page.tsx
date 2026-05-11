"use client"

import { useRef, useState } from "react"
import GalileoCircle from "@/components/GalileoCircle"
import { TAROT_DECK } from "@/lib/tarot"
import { initSounds } from "@/lib/sounds"

// Bell chime via WAV — same inharmonic partial structure as sounds.ts bellChime()
// Uses new Audio() instead of AudioContext so it works on mobile after async gaps
function chime(freq: number, vol = 0.4, ms = 1800) {
  const sr = 22050, n = Math.floor(sr * ms / 1000)
  // Inharmonic overtones of a struck metal bell — same ratios as bellChime() in sounds.ts
  const partials = [{r:1,g:1},{r:2.756,g:0.45},{r:5.404,g:0.2},{r:8.933,g:0.08}]
  const decayRate = 5.7 / (ms / 1000)  // decay to ~0 by end of buffer
  const raw = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sr
    const env = Math.min(1, t * 250) * Math.exp(-t * decayRate)  // 4ms attack, bell decay
    let s = 0
    for (const {r, g} of partials) s += Math.sin(2 * Math.PI * freq * r * t) * g
    raw[i] = s * env * vol * 0.5  // 0.5 ≈ vol/sum(gains) normalization
  }
  // Single reverb echo at 120ms, 20% wet — gives the metallic ring depth
  const echoAt = Math.floor(0.12 * sr), orig = new Float32Array(raw)
  for (let i = echoAt; i < n; i++) raw[i] += orig[i - echoAt] * 0.20

  const buf = new ArrayBuffer(44 + n * 2); const v = new DataView(buf)
  const ws = (o: number, t: string) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)) }
  ws(0,"RIFF"); v.setUint32(4,36+n*2,true); ws(8,"WAVE"); ws(12,"fmt ")
  v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true)
  v.setUint32(24,sr,true); v.setUint32(28,sr*2,true); v.setUint16(32,2,true)
  v.setUint16(34,16,true); ws(36,"data"); v.setUint32(40,n*2,true)
  for (let i = 0; i < n; i++) v.setInt16(44+i*2, Math.max(-32768,Math.min(32767,raw[i]*32767)),true)
  const src = URL.createObjectURL(new Blob([buf],{type:"audio/wav"}))
  const a = new Audio(src); a.onended=()=>URL.revokeObjectURL(src); a.onerror=()=>URL.revokeObjectURL(src); a.play().catch(()=>URL.revokeObjectURL(src))
}

function playOpenChime() {
  chime(261.63, 0.3, 2000)
  setTimeout(() => chime(329.63, 0.25, 1800), 160)
  setTimeout(() => chime(392,    0.22, 1600), 320)
  setTimeout(() => chime(523.25, 0.2,  1400), 480)
  setTimeout(() => chime(659.25, 0.18, 1200), 680)
}

function playRevealChime(i: number) {
  const roots = [523.25, 659.25, 783.99, 1046.5, 1318.5]
  const r = roots[i % roots.length]
  chime(r,        0.3,  1600)
  setTimeout(() => chime(r * 1.25, 0.22, 1400), 100)
  setTimeout(() => chime(r * 1.5,  0.18, 1200), 220)
  setTimeout(() => chime(r * 2,    0.12, 1000), 380)
}

// Five dramatic cards for the spread reveal
const DEMO_CARDS = [
  { name: "The High Priestess", position: "The situation"   },
  { name: "The Lovers",         position: "What crosses you" },
  { name: "The Tower",          position: "The root"        },
  { name: "The Star",           position: "What crowns you" },
  { name: "The Moon",           position: "The outcome"     },
]

const HOOK    = `The cards have been waiting for you.`
const INTRO   = `I'm Galileo — an ancient oracle. I give tarot, dream, palm, and love readings. Every word spoken aloud, in real time.`
const READING = `The Moon. Move forward without knowing where it ends. That discomfort is the path. The cards don't lie.`

const FEATURES = [
  { icon: "★", label: "Tarot Reading",   color: "#c9a84c" },
  { icon: "♠", label: "Playing Cards",   color: "#e879a0" },
  { icon: "♡", label: "Love Oracle",     color: "#e879a0" },
  { icon: "✋", label: "Palm Reading",    color: "#c8d4e8" },
  { icon: "☁", label: "Dream Reading",   color: "#a5b4fc" },
  { icon: "☽", label: "Moon Reading",    color: "#a5b4fc" },
  { icon: "✦", label: "Birth Chart",     color: "#fbbf24" },
  { icon: "◎", label: "Yes or No",       color: "#a5b4fc" },
]

function slug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

// Reliable MP3 playback — no AudioContext complexity
async function speak(text: string): Promise<void> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })
  if (!res.ok || res.status === 204 || !res.body) return
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value?.byteLength) { chunks.push(value); total += value.byteLength }
  }
  if (!total) return
  const all = new Uint8Array(total); let off = 0
  for (const c of chunks) { all.set(c, off); off += c.byteLength }
  const blob = new Blob([all], { type: "audio/mpeg" })
  const src  = URL.createObjectURL(blob)
  await new Promise<void>(resolve => {
    const a = new Audio(src)
    a.onended = () => { URL.revokeObjectURL(src); resolve() }
    a.onerror = () => { URL.revokeObjectURL(src); resolve() }
    a.play().catch(() => { URL.revokeObjectURL(src); resolve() })
  })
}

export default function DemoPage() {
  const [avatarState, setAvatarState] = useState<"idle"|"thinking"|"speaking"|"closed">("idle")
  const [phase, setPhase]             = useState<"ready"|"running"|"done">("ready")
  const [showFeatures, setShowFeatures] = useState(false)
  const [dealtCards, setDealtCards]   = useState(0)
  const [showCta, setShowCta]         = useState(false)
  const simliSendRef = useRef<((pcm: Uint8Array) => void) | null>(null)

  async function runDemo() {
    if (phase !== "ready") return

    setPhase("running")
    setAvatarState("speaking")

    // Wake up the shared AudioContext used by sounds.ts — must happen within user gesture
    await initSounds()
    try { new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==").play().catch(() => {}) } catch {}

    // Hook — plays while just Galileo visible
    await speak(HOOK)

    // Features slide in while he describes the product
    setShowFeatures(true)
    await speak(INTRO)

    // Cards deal — WAV-based chimes via Audio element, no AudioContext needed
    setAvatarState("thinking")
    playOpenChime()
    await new Promise(r => setTimeout(r, 700))

    for (let i = 0; i < DEMO_CARDS.length; i++) {
      setDealtCards(i + 1)
      playRevealChime(i)
      await new Promise(r => setTimeout(r, 480))
    }

    await new Promise(r => setTimeout(r, 500))

    // Reading
    setAvatarState("speaking")
    await speak(READING)

    setAvatarState("idle")
    setShowCta(true)
    setPhase("done")
  }

  const left  = FEATURES.slice(0, 4)
  const right = FEATURES.slice(4)

  return (
    <>
      {/* Black letterbox — fills everything outside the 9:16 frame */}
      <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 0 }} />

      {/* 9:16 TikTok ad frame — centered on screen */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        // Fit inside viewport while preserving 9:16
        width: "min(100vw, calc(100vh * 9 / 16))",
        height: "min(100vh, calc(100vw * 16 / 9))",
        background: "radial-gradient(ellipse at 50% 20%, rgba(42,26,85,0.85) 0%, #04020e 65%)",
        overflow: "hidden",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>

        {/* Domain watermark — inside the frame, always visible in recording */}
        <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", zIndex: 50, pointerEvents: "none" }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.3em", color: "rgba(201,168,76,0.85)", textShadow: "0 0 24px rgba(201,168,76,0.5)" }}>
            ASKGALILEO.LIVE
          </div>
        </div>

        {/* Scrollable content — fits inside the frame */}
        <div style={{ width: "100%", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 12px 80px", gap: 18 }}>

          {/* Title */}
          <div style={{ textAlign: "center", paddingTop: 6 }}>
            <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 18, letterSpacing: "0.15em" }} className="text-shimmer">GALILEO</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.3em", color: "#4a3870", marginTop: 3 }}>THE CELESTIAL ORACLE</div>
          </div>

          {/* Face + feature columns */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>

            {/* Left */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {left.map((f, i) => (
                <div key={f.label} style={{
                  opacity: showFeatures ? 1 : 0,
                  transform: showFeatures ? "translateX(0)" : "translateX(-20px)",
                  transition: `opacity 0.35s ease ${i * 100}ms, transform 0.35s ease ${i * 100}ms`,
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 10px", borderRadius: 7,
                  border: `1px solid ${f.color}28`, background: `${f.color}0a`,
                }}>
                  <span style={{ fontSize: 15, color: f.color, filter: `drop-shadow(0 0 6px ${f.color})`, flexShrink: 0 }}>{f.icon}</span>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.1em", color: f.color, opacity: 0.9, lineHeight: 1.3 }}>{f.label.toUpperCase()}</span>
                </div>
              ))}
            </div>

            {/* Galileo */}
            <div style={{ flexShrink: 0 }}>
              <GalileoCircle
                state={avatarState}
                size={200}
                showName={false}
                showStars={false}
                onSendAudio={fn => { simliSendRef.current = fn }}
              />
            </div>

            {/* Right */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {right.map((f, i) => (
                <div key={f.label} style={{
                  opacity: showFeatures ? 1 : 0,
                  transform: showFeatures ? "translateX(0)" : "translateX(20px)",
                  transition: `opacity 0.35s ease ${i * 100 + 50}ms, transform 0.35s ease ${i * 100 + 50}ms`,
                  display: "flex", alignItems: "center", gap: 6, flexDirection: "row-reverse",
                  padding: "8px 10px", borderRadius: 7,
                  border: `1px solid ${f.color}28`, background: `${f.color}0a`,
                }}>
                  <span style={{ fontSize: 15, color: f.color, filter: `drop-shadow(0 0 6px ${f.color})`, flexShrink: 0 }}>{f.icon}</span>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.1em", color: f.color, opacity: 0.9, lineHeight: 1.3, textAlign: "right" }}>{f.label.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cards spread */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "nowrap", width: "100%", padding: "0 4px" }}>
            {DEMO_CARDS.map((card, i) => {
              const data = TAROT_DECK.find(c => c.name === card.name)
              const visible = i < dealtCards
              return (
                <div key={card.name} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: 1,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.92)",
                  transition: "opacity 0.5s ease, transform 0.5s ease",
                }}>
                  <div style={{ width: "100%", aspectRatio: "2/3", borderRadius: 6, overflow: "hidden", border: "1px solid rgba(201,168,76,0.4)", boxShadow: "0 6px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.1)" }}>
                    {data && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/cards/${slug(card.name)}.jpg`} alt={card.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    )}
                  </div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 6, letterSpacing: "0.07em", color: "#4a3870", textAlign: "center", lineHeight: 1.3 }}>
                    {card.position}
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA */}
          {showCta && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, animation: "fadeUp 0.7s ease-out forwards" }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, letterSpacing: "0.22em", color: "#c9a84c", textShadow: "0 0 28px rgba(201,168,76,0.7)" }}>
                THE CARDS DON&apos;T LIE.
              </div>
              <a href="/signup" style={{ padding: "16px 48px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.6)", background: "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(79,70,229,0.18))", color: "#f0cc6e", fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: "0.2em", textDecoration: "none" }}>
                GET YOUR READING ✦
              </a>
            </div>
          )}

          {phase === "ready" && (
            <button onClick={runDemo} style={{ padding: "18px 60px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.5)", background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(79,70,229,0.15))", color: "#f0cc6e", fontFamily: "'Cinzel', serif", fontSize: 14, letterSpacing: "0.2em", cursor: "pointer", animation: "breathe 4s ease-in-out infinite" }}>
              BEGIN ✦
            </button>
          )}

          {phase === "done" && (
            <button onClick={() => { setPhase("ready"); setShowFeatures(false); setDealtCards(0); setShowCta(false); setAvatarState("idle") }}
              style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "#2a1a55", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.1em" }}>
              REPLAY
            </button>
          )}
        </div>
      </div>
    </>
  )
}
