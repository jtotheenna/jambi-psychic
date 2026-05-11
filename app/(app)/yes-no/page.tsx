"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useGalileoVoice } from "@/lib/useGalileoVoice"
import { speakStreaming } from "@/lib/speak"
import { playBoxOpen, playSessionEnd } from "@/lib/sounds"
import { readSSE, nextBoundary } from "@/lib/readSSE"
import GalileoPanel from "@/components/GalileoPanel"

// ── Coin SVG faces ────────────────────────────────────────────────────────────

function YesFace() {
  const dots = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2
    return { x: 100 + 91 * Math.cos(a), y: 100 + 91 * Math.sin(a) }
  })
  const sunRays = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2
    return { x1: 62 + 14 * Math.cos(a), y1: 52 + 14 * Math.sin(a), x2: 62 + 21 * Math.cos(a), y2: 52 + 21 * Math.sin(a) }
  })
  return (
    <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%", borderRadius: "50%" }}>
      <defs>
        <radialGradient id="yesBg" cx="38%" cy="35%">
          <stop offset="0%" stopColor="#f0d878" />
          <stop offset="40%" stopColor="#c9a84c" />
          <stop offset="100%" stopColor="#7a6020" />
        </radialGradient>
        <radialGradient id="sunGrad" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#f8e890" />
          <stop offset="100%" stopColor="#c09030" />
        </radialGradient>
        <filter id="yesEmboss">
          <feConvolveMatrix order="3" kernelMatrix="-2 -1 0 -1 1 1 0 1 2" />
        </filter>
      </defs>
      {/* Base */}
      <circle cx="100" cy="100" r="99" fill="url(#yesBg)" />
      <circle cx="100" cy="100" r="99" fill="none" stroke="#6a6660" strokeWidth="2" />
      {/* Beaded border */}
      {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r="3" fill="#8a6820" stroke="#f0cc6e" strokeWidth="0.6" />)}
      {/* Inner decorative ring */}
      <circle cx="100" cy="100" r="80" fill="none" stroke="#c9a84c" strokeWidth="0.8" strokeDasharray="2,3" />
      {/* Sun */}
      {sunRays.map((r, i) => <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke="#f0cc6e" strokeWidth="2.5" strokeLinecap="round" />)}
      <circle cx="62" cy="52" r="12" fill="url(#sunGrad)" stroke="#c09030" strokeWidth="1.5" />
      <circle cx="62" cy="52" r="6" fill="#f8e870" opacity="0.5" />
      {/* Moon */}
      <circle cx="140" cy="52" r="13" fill="#e8d888" stroke="#c0a040" strokeWidth="1.5" />
      <circle cx="147" cy="46" r="11" fill="url(#yesBg)" />
      {/* Left hand */}
      <g fill="#a88030" stroke="#7a5820" strokeWidth="0.8" opacity="0.85">
        <rect x="22" y="82" width="9" height="28" rx="4" />
        <rect x="32" y="72" width="9" height="35" rx="4" />
        <rect x="42" y="70" width="9" height="38" rx="4" />
        <rect x="52" y="74" width="9" height="34" rx="4" />
        <rect x="62" y="82" width="9" height="26" rx="4" />
        <path d="M22 110 Q 24 122 35 125 Q 60 128 71 122 L 71 108 Z" />
      </g>
      {/* Right hand (mirror) */}
      <g fill="#a88030" stroke="#7a5820" strokeWidth="0.8" opacity="0.85" transform="scale(-1,1) translate(-200,0)">
        <rect x="22" y="82" width="9" height="28" rx="4" />
        <rect x="32" y="72" width="9" height="35" rx="4" />
        <rect x="42" y="70" width="9" height="38" rx="4" />
        <rect x="52" y="74" width="9" height="34" rx="4" />
        <rect x="62" y="82" width="9" height="26" rx="4" />
        <path d="M22 110 Q 24 122 35 125 Q 60 128 71 122 L 71 108 Z" />
      </g>
      {/* YES text */}
      <text x="100" y="117" textAnchor="middle" fontFamily="Cinzel,serif" fontSize="36" fontWeight="900" fill="#3a2808" letterSpacing="3" opacity="0.9">YES</text>
      <text x="100" y="117" textAnchor="middle" fontFamily="Cinzel,serif" fontSize="36" fontWeight="900" fill="none" stroke="#f0e890" strokeWidth="0.6" letterSpacing="3" opacity="0.5">YES</text>
      {/* Eyes */}
      <ellipse cx="72" cy="148" rx="14" ry="10" fill="#4a3010" stroke="#c9a84c" strokeWidth="1.5" />
      <ellipse cx="72" cy="148" rx="7" ry="6" fill="#1a0808" />
      <circle cx="69" cy="146" r="2.5" fill="#f0cc6e" opacity="0.7" />
      <ellipse cx="128" cy="148" rx="14" ry="10" fill="#4a3010" stroke="#c9a84c" strokeWidth="1.5" />
      <ellipse cx="128" cy="148" rx="7" ry="6" fill="#1a0808" />
      <circle cx="125" cy="146" r="2.5" fill="#f0cc6e" opacity="0.7" />
      {/* Eyebrows */}
      <path d="M 58 138 Q 72 133 86 138" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 114 138 Q 128 133 142 138" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      {/* Subtle surface texture */}
      <circle cx="100" cy="100" r="99" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
    </svg>
  )
}

function NoFace() {
  const dots = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2
    return { x: 100 + 91 * Math.cos(a), y: 100 + 91 * Math.sin(a) }
  })
  return (
    <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%", borderRadius: "50%" }}>
      <defs>
        <radialGradient id="noBg" cx="55%" cy="40%">
          <stop offset="0%" stopColor="#b89040" />
          <stop offset="50%" stopColor="#805818" />
          <stop offset="100%" stopColor="#3a2808" />
        </radialGradient>
        <radialGradient id="skullGrad" cx="45%" cy="40%">
          <stop offset="0%" stopColor="#d4a848" />
          <stop offset="100%" stopColor="#8a6020" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="99" fill="url(#noBg)" />
      <circle cx="100" cy="100" r="99" fill="none" stroke="#484840" strokeWidth="2" />
      {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r="3" fill="#5a3808" stroke="#c9a84c" strokeWidth="0.6" />)}
      <circle cx="100" cy="100" r="80" fill="none" stroke="#8a6020" strokeWidth="0.8" strokeDasharray="2,3" />
      {/* Wings — left */}
      <g fill="#7a5018" stroke="#3a2008" strokeWidth="0.8" opacity="0.9">
        <path d="M 56 55 Q 30 45 18 62 Q 28 58 35 65 Q 22 68 16 82 Q 28 74 38 78 Q 24 86 22 100 Q 36 88 48 90 Q 38 100 40 112 L 56 95 Z" />
      </g>
      {/* Wings — right (mirror) */}
      <g fill="#7a5018" stroke="#3a2008" strokeWidth="0.8" opacity="0.9" transform="scale(-1,1) translate(-200,0)">
        <path d="M 56 55 Q 30 45 18 62 Q 28 58 35 65 Q 22 68 16 82 Q 28 74 38 78 Q 24 86 22 100 Q 36 88 48 90 Q 38 100 40 112 L 56 95 Z" />
      </g>
      {/* Skull */}
      <ellipse cx="100" cy="52" rx="22" ry="20" fill="url(#skullGrad)" stroke="#7a5010" strokeWidth="1.5" />
      {/* Eye sockets */}
      <ellipse cx="91" cy="51" rx="6" ry="7" fill="#1a0808" />
      <ellipse cx="109" cy="51" rx="6" ry="7" fill="#1a0808" />
      {/* Nose cavity */}
      <path d="M 97 60 L 100 65 L 103 60 Z" fill="#1a0808" />
      {/* Teeth */}
      <rect x="90" y="66" width="5" height="6" rx="1" fill="#3a2008" stroke="#7a5010" strokeWidth="0.5" />
      <rect x="96" y="66" width="5" height="7" rx="1" fill="#3a2008" stroke="#7a5010" strokeWidth="0.5" />
      <rect x="102" y="66" width="5" height="6" rx="1" fill="#3a2008" stroke="#7a5010" strokeWidth="0.5" />
      {/* Jaw */}
      <path d="M 82 64 Q 100 78 118 64" fill="#b08030" stroke="#7a5010" strokeWidth="1.5" />
      {/* NO text */}
      <text x="100" y="118" textAnchor="middle" fontFamily="Cinzel,serif" fontSize="36" fontWeight="900" fill="#1a0808" letterSpacing="4" opacity="0.9">NO</text>
      <text x="100" y="118" textAnchor="middle" fontFamily="Cinzel,serif" fontSize="36" fontWeight="900" fill="none" stroke="#f0cc6e" strokeWidth="0.6" letterSpacing="4" opacity="0.4">NO</text>
      {/* Heart */}
      <path d="M 100 155 L 82 140 A 12 12 0 0 1 100 128 A 12 12 0 0 1 118 140 Z" fill="#6a2010" stroke="#c04030" strokeWidth="1.5" opacity="0.85" />
      {/* Ankh/cross below */}
      <circle cx="100" cy="173" r="6" fill="none" stroke="#c9a84c" strokeWidth="1.5" />
      <line x1="100" y1="179" x2="100" y2="190" stroke="#c9a84c" strokeWidth="1.5" />
      <line x1="93" y1="182" x2="107" y2="182" stroke="#c9a84c" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="99" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    </svg>
  )
}

function OracleFace({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%", borderRadius: "50%" }}>
      <defs>
        <radialGradient id="oracleBg" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#2a2060" />
          <stop offset="100%" stopColor="#0a0520" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="99" fill="url(#oracleBg)" />
      {Array.from({ length: 36 }, (_, i) => {
        const a = (i / 36) * Math.PI * 2
        return <circle key={i} cx={100 + 91 * Math.cos(a)} cy={100 + 91 * Math.sin(a)} r="2.5" fill="#3a3060" stroke="#a5b4fc" strokeWidth="0.5" opacity="0.7" />
      })}
      <circle cx="100" cy="100" r="80" fill="none" stroke="#4f46e5" strokeWidth="0.8" strokeDasharray="2,3" />
      <circle cx="100" cy="100" r="18" fill="#1a1048" stroke="#a5b4fc" strokeWidth="1.5" />
      <ellipse cx="100" cy="100" rx="7" ry="9" fill="#0a0820" />
      <circle cx="97" cy="97" r="2.5" fill="#a5b4fc" opacity="0.8" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return <line key={i} x1={100 + 22 * Math.cos(a)} y1={100 + 22 * Math.sin(a)} x2={100 + 30 * Math.cos(a)} y2={100 + 30 * Math.sin(a)} stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      })}
      <text x="100" y="152" textAnchor="middle" fontFamily="Cinzel,serif" fontSize="13" fontWeight="700" fill="#a5b4fc" letterSpacing="1" opacity="0.9">{label}</text>
    </svg>
  )
}

// ── Coin flip component ────────────────────────────────────────────────────────

const FACE_MAP: Record<string, "yes" | "no" | "oracle"> = {
  YES: "yes", NO: "no",
  PERHAPS: "oracle", "NOT YET": "oracle",
}

const ORACLE_LABELS: Record<string, string> = {
  PERHAPS: "PERHAPS", "NOT YET": "NOT YET",
}

// box-shadow glow applied to the perspective wrapper (not the preserve-3d element — filter there breaks 3D)
const GLOW: Record<string, string> = {
  YES: "0 0 60px rgba(201,168,76,0.6), 0 0 120px rgba(201,168,76,0.3)",
  NO:  "0 0 60px rgba(190,18,60,0.6),  0 0 120px rgba(190,18,60,0.3)",
  PERHAPS: "0 0 60px rgba(165,180,252,0.5)",
  "NOT YET": "0 0 60px rgba(245,158,11,0.5)",
}

function OracleCoin({ answer }: { answer: string | null }) {
  const [flipping, setFlipping] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!answer) return
    setFlipping(true)
    const t = setTimeout(() => setDone(true), 2000)
    return () => clearTimeout(t)
  }, [answer])

  const face = answer ? FACE_MAP[answer] ?? "oracle" : "yes"
  // YES = land on front (0 mod 360), NO = land on back (180 mod 360), oracle = edge (90)
  const rotation = face === "yes" ? 2160 : face === "no" ? 2160 + 180 : 2160 + 90

  return (
    <div style={{
      perspective: "1200px", width: 220, height: 220, borderRadius: "50%",
      // box-shadow on the perspective wrapper — never on the preserve-3d element (filter breaks 3D backfaceVisibility)
      boxShadow: done && answer ? GLOW[answer] : "0 8px 24px rgba(0,0,0,0.6)",
      transition: "box-shadow 0.8s ease",
    }}>
      <div style={{
        width: 220, height: 220,
        position: "relative",
        transformStyle: "preserve-3d",
        transition: flipping ? "transform 2s cubic-bezier(0.23, 1, 0.32, 1)" : "none",
        transform: flipping ? `rotateY(${rotation}deg)` : "rotateY(0deg)",
      }}>
        {/* Front: YES */}
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", backfaceVisibility: "hidden", overflow: "hidden" }}>
          <YesFace />
        </div>
        {/* Back: NO (rotated 180°) */}
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", backfaceVisibility: "hidden", transform: "rotateY(180deg)", overflow: "hidden" }}>
          <NoFace />
        </div>
        {/* Edge: oracle answers (rotated 90°) */}
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", backfaceVisibility: "hidden", transform: "rotateY(-90deg)", overflow: "hidden" }}>
          <OracleFace label={answer ? (ORACLE_LABELS[answer] ?? answer) : ""} />
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function YesNoPage() {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState<string | null>(null)
  const [reading, setReading] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [showReading, setShowReading] = useState(false)
  const simliSendRef = useRef<((pcm: Uint8Array) => void) | null>(null)
  const voice = useGalileoVoice()
  const language = "en"
  useEffect(() => { voice.open() }, []) // eslint-disable-line

  const audioChainRef = useRef<Promise<void>>(Promise.resolve())

  async function consult() {
    if (!question.trim() || loading) return
    const sa = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    sa.volume = 0; sa.play().catch(() => {})
    playBoxOpen()
    setHasStarted(true)
    setLoading(true)
    voice.setAvatarState("thinking")
    audioChainRef.current = Promise.resolve()

    const res = await fetch("/api/yes-no", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, language }),
    })
    if (!res.ok || !res.body) { setLoading(false); voice.setAvatarState("idle"); return }

    let pending = ""
    let coinShown = false
    const queueSentence = (text: string) => {
      if (voice.mode === "text" || !text.trim()) return
      voice.setAvatarState("speaking")
      audioChainRef.current = audioChainRef.current.then(() => speakStreaming(text, simliSendRef.current))
    }

    await readSSE(res.body, (data) => {
      if (data.type === "answer") {
        setAnswer(data.answer as string)
        setLoading(false)
        if (!coinShown) { coinShown = true; setTimeout(() => setShowReading(true), 2200) }
      } else if (data.type === "delta") {
        setReading(prev => prev + (data.text as string))
        pending += data.text as string
        const b = nextBoundary(pending)
        if (b !== -1) { queueSentence(pending.slice(0, b)); pending = pending.slice(b) }
      } else if (data.type === "done") {
        queueSentence(pending.trim()); pending = ""
      }
    })

    await audioChainRef.current
    voice.setAvatarState("idle")
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(42,26,85,0.5)" }}>
        <Link href="/dashboard" style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7a8ba8", textDecoration: "none" }}>← RETURN</Link>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#a5b4fc" }}>☾ YES OR NO ORACLE</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ flex: 1, maxWidth: 600, width: "100%", margin: "0 auto", padding: "32px 16px", display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>

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

        {/* Question input */}
        {!hasStarted && (
          <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: "#8878a8", fontStyle: "italic", textAlign: "center", lineHeight: 1.7 }}>
              Ask a question that can be answered yes or no. Speak it clearly, with intention.
            </p>
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
              style={{ padding: "14px", borderRadius: 8, border: "1px solid rgba(165,180,252,0.4)", background: question.trim() ? "linear-gradient(135deg, rgba(79,70,229,0.2), rgba(124,58,237,0.2))" : "rgba(42,26,85,0.3)", color: question.trim() ? "#a5b4fc" : "#4a3870", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", cursor: question.trim() ? "pointer" : "not-allowed" }}
            >
              CONSULT THE ORACLE ✦
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", gap: 8, padding: "16px 0" }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#a5b4fc", animation: "moonPulse 1.2s ease-in-out infinite", animationDelay: `${i*0.3}s` }} />)}
          </div>
        )}

        {/* Coin — appears as soon as answer arrives */}
        {answer && !loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: "100%", maxWidth: 500 }}>

            {/* The coin */}
            <div style={{ animation: "fadeUp 0.4s ease-out forwards" }}>
              <OracleCoin answer={answer} />
            </div>

            {/* Answer label */}
            <div style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: "clamp(28px, 7vw, 44px)",
              letterSpacing: "0.2em",
              color: answer === "YES" ? "#c9a84c" : answer === "NO" ? "#be123c" : answer === "PERHAPS" ? "#a5b4fc" : answer === "NOT YET" ? "#f59e0b" : "#7c3aed",
              textShadow: `0 0 30px currentColor`,
              animation: "fadeUp 0.6s ease-out 0.3s forwards",
              opacity: 0,
            }}>
              {answer}
            </div>

            {/* Reading — fades in after coin settles */}
            {showReading && (
              <div style={{ padding: "28px 32px", borderRadius: 12, border: "1px solid rgba(165,180,252,0.15)", background: "linear-gradient(135deg, rgba(26,13,63,0.92), rgba(10,5,32,0.95))", backdropFilter: "blur(8px)", animation: "fadeUp 0.7s ease-out forwards" }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.25em", color: "#7a8ba8", marginBottom: 20 }}>☾ THE ORACLE SPEAKS</div>
                {reading.split("\n\n").filter(p => p.trim()).map((para, i) => (
                  <p key={i} style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, lineHeight: 1.9, color: "#ddd8f0", marginBottom: i < reading.split("\n\n").filter(p => p.trim()).length - 1 ? 18 : 0 }}>
                    {para}
                  </p>
                ))}
              </div>
            )}

            {showReading && (
              <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease-out 0.2s forwards", opacity: 0 }}>
                <Link href="/dashboard" style={{ padding: "10px 28px", borderRadius: 8, border: "1px solid rgba(165,180,252,0.3)", background: "rgba(165,180,252,0.06)", color: "#a5b4fc", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", textDecoration: "none" }}>
                  RETURN ✦
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
