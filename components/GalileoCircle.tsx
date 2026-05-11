"use client"

import { useEffect, useRef, useState } from "react"

type Props = {
  state: "idle" | "thinking" | "speaking" | "closed"
  size?: number
  showName?: boolean
  showStars?: boolean
}

function CircleStatic({ opacity }: { opacity: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    function draw() {
      if (!canvas || !ctx) return
      const { width: w, height: h } = canvas
      const img = ctx.createImageData(w, h)
      const d = img.data
      for (let i = 0; i < d.length; i += 4) {
        const bright = Math.random() > 0.5
          ? 180 + Math.floor(Math.random() * 75)
          : Math.floor(Math.random() * 50)
        d[i] = bright; d[i+1] = bright; d[i+2] = bright + Math.floor(Math.random()*40); d[i+3] = 230
      }
      ctx.putImageData(img, 0, 0)
      ctx.fillStyle = "rgba(0,0,0,0.18)"
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1)
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <canvas ref={canvasRef} width={300} height={300} style={{
      position: "absolute", inset: 0, width: "100%", height: "100%",
      opacity, transition: "opacity 1.2s ease", pointerEvents: "none", zIndex: 10,
    }} />
  )
}

export default function GalileoCircle({ state, size = 200, showName = true, showStars = true }: Props) {
  const [staticOpacity, setStaticOpacity] = useState(0)
  const [faceVisible,   setFaceVisible]   = useState(false)
  const [internalState, setInternalState] = useState<typeof state>("closed")
  const [effectiveSize, setEffectiveSize] = useState(size)

  const hasOpenedRef = useRef(false)

  // Cap size to viewport on mobile
  useEffect(() => {
    const update = () => setEffectiveSize(Math.min(size, window.innerWidth * 0.76))
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [size])

  // Reveal sequence
  useEffect(() => {
    if (state === "closed") {
      setFaceVisible(false)
      setStaticOpacity(0)
      setInternalState("closed")
      hasOpenedRef.current = false
      return
    }
    if (!hasOpenedRef.current) {
      hasOpenedRef.current = true
      setStaticOpacity(1)
      setTimeout(() => {
        setFaceVisible(true)
        setInternalState(state)
        setTimeout(() => setStaticOpacity(0), 300)
      }, 600)
    } else {
      setInternalState(state)
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  const isThinking = internalState === "thinking"
  const isSpeaking = internalState === "speaking"

  const glowColor  = isThinking || isSpeaking ? "rgba(165,180,252,0.7)" : "rgba(201,168,76,0.45)"
  const glowShadow = isThinking
    ? "0 0 40px rgba(165,180,252,0.5), 0 0 80px rgba(165,180,252,0.2)"
    : isSpeaking
    ? "0 0 50px rgba(165,180,252,0.6), 0 0 100px rgba(201,168,76,0.2)"
    : "0 0 30px rgba(201,168,76,0.3), 0 8px 40px rgba(0,0,0,0.7)"

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {showStars && (
        <div style={{ display: "flex", gap: 24, marginBottom: 4, height: 28, alignItems: "flex-end" }}>
          {["★","✦","★"].map((s, i) => (
            <span key={i} className="animate-star-float" style={{
              animationDelay: `${i * 0.8}s`,
              fontSize: i === 1 ? 18 : 12,
              color: i === 1 ? "#f0cc6e" : "#c9a84c",
              opacity: 0.5,
            }}>{s}</span>
          ))}
        </div>
      )}

      <div style={{ position: "relative", width: effectiveSize, height: effectiveSize }}>
        {/* Glow ring */}
        <div style={{
          position: "absolute", inset: -10, borderRadius: "50%",
          background: isThinking || isSpeaking
            ? "conic-gradient(from 0deg, rgba(165,180,252,0.6), rgba(201,168,76,0.4), rgba(165,180,252,0.6))"
            : "conic-gradient(from 0deg, rgba(201,168,76,0.3), rgba(165,180,252,0.12), rgba(201,168,76,0.3))",
          animation: isThinking ? "spin 2s linear infinite" : "spin 8s linear infinite",
          filter: "blur(3px)",
          transition: "background 0.6s ease",
        }} />

        {/* Circle */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          overflow: "hidden",
          border: `2px solid ${glowColor}`,
          boxShadow: glowShadow,
          transition: "box-shadow 0.5s ease, border-color 0.5s ease",
          background: "#04020e",
        }}>
          {/* Living glow */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 0,
            background: isThinking
              ? "radial-gradient(ellipse 90% 95% at 50% 45%, rgba(79,70,229,0.55) 0%, rgba(124,58,237,0.3) 35%, rgba(42,26,85,0.15) 65%, transparent 85%)"
              : isSpeaking
              ? "radial-gradient(ellipse 90% 95% at 50% 45%, rgba(201,168,76,0.4) 0%, rgba(79,70,229,0.25) 35%, rgba(42,26,85,0.12) 65%, transparent 85%)"
              : "radial-gradient(ellipse 90% 95% at 50% 45%, rgba(79,70,229,0.38) 0%, rgba(124,58,237,0.18) 35%, rgba(42,26,85,0.1) 65%, transparent 85%)",
            animation: isThinking
              ? "glowPulse 1.4s ease-in-out infinite"
              : isSpeaking
              ? "glowPulse 0.9s ease-in-out infinite"
              : "glowPulse 4s ease-in-out infinite",
            transition: "background 0.6s ease",
          }} />

          {/* Static jpg fallback — always visible once revealed */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/galileo.jpg"
            alt=""
            style={{
              position: "absolute", top: "-10%", left: 0,
              width: "100%", height: "120%",
              objectFit: "cover", objectPosition: "center top",
              zIndex: 1,
              opacity: faceVisible ? 1 : 0,
              transition: "opacity 0.6s ease",
            }}
          />

          {/* Idle loop — drop /public/galileo-idle.webm to activate; jpg shows until then */}
          <video
            src="/galileo-idle-v2.webm"
            autoPlay
            loop
            muted
            playsInline
            onError={e => { (e.currentTarget as HTMLVideoElement).style.display = "none" }}
            style={{
              position: "absolute", top: "-10%", left: 0,
              width: "100%", height: "120%",
              objectFit: "cover", objectPosition: "center top",
              zIndex: 2,
              opacity: faceVisible ? 1 : 0,
              transition: "opacity 0.6s ease",
            }}
          />

          {/* Scan lines */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none",
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 3px)",
          }} />

          {/* Vignette */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none",
            background: "radial-gradient(ellipse at center, transparent 50%, rgba(4,2,14,0.55) 100%)",
          }} />

          {/* TV static reveal */}
          <CircleStatic opacity={staticOpacity} />
        </div>
      </div>

      {showName && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 18, letterSpacing: "0.15em" }} className="text-shimmer">
            GALILEO
          </div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.2em", color: "#7a8ba8", marginTop: 2 }}>
            THE CELESTIAL ORACLE
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
