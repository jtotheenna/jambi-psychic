"use client"

import { useEffect, useRef, useState, useCallback } from "react"

type Props = {
  state: "idle" | "thinking" | "speaking" | "closed"
  size?: number
  showName?: boolean
  showStars?: boolean
  onSendAudio?: (fn: (pcm: Uint8Array) => void) => void
  onReady?: () => void
  onSimliConnected?: (isConnected: boolean) => void  // tells parent if Simli is live
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
      opacity, transition: "opacity 1.2s ease", pointerEvents: "none", zIndex: 2,
    }} />
  )
}

export default function GalileoCircle({ state, size = 200, showName = true, showStars = true, onSendAudio, onReady, onSimliConnected }: Props) {
  const [staticOpacity, setStaticOpacity]  = useState(0)
  const [faceVisible,   setFaceVisible]    = useState(false)
  const [internalState, setInternalState]  = useState<typeof state>("closed")
  const [simliReady,    setSimliReady]     = useState(false)
  const [winking,       setWinking]        = useState(false)
  const [effectiveSize, setEffectiveSize]  = useState(size)
  const hasOpenedRef  = useRef(false)
  const hasWinkedRef  = useRef(false)

  // Cap size to viewport on mobile so it never overflows
  useEffect(() => {
    const update = () => setEffectiveSize(Math.min(size, window.innerWidth * 0.76))
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [size])
  const videoRef     = useRef<HTMLVideoElement>(null)
  const audioRef     = useRef<HTMLAudioElement>(null)
  const clientRef    = useRef<unknown>(null)

  // Simli connection
  const initSimli = useCallback(async () => {
    try {
      const { SimliClient, generateIceServers } = await import("simli-client")
      const tokenRes = await fetch("/api/simli/token", { method: "POST" })
      if (!tokenRes.ok) return
      const { session_token } = await tokenRes.json()
      const iceServers = await generateIceServers("o9f1298cjhpilxszvk193q")
      const client = new SimliClient(
        session_token, videoRef.current!, audioRef.current!, iceServers ?? null
      )
      client.on("start", () => {
        setSimliReady(true)
        onSimliConnected?.(true)
        if (onSendAudio) {
          onSendAudio((pcm: Uint8Array) => {
            const CHUNK = 6000
            for (let offset = 0; offset < pcm.length; offset += CHUNK) {
              (client as { sendAudioData: (d: Uint8Array) => void }).sendAudioData(pcm.slice(offset, offset + CHUNK))
            }
          })
        }
      })
      await client.start()
      clientRef.current = client
    } catch (err) {
      console.error("GalileoCircle Simli error:", err)
    }
  }, [onSendAudio])

  useEffect(() => {
    initSimli()
    return () => { (clientRef.current as { stop?: () => void })?.stop?.() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      // No static — face revealed as soon as Simli connects
      setFaceVisible(true)
      setInternalState(state)
      onReady?.()
    } else {
      setInternalState(state)
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  const isThinking = internalState === "thinking"
  const isSpeaking = internalState === "speaking"

  const glowColor = isThinking || isSpeaking
    ? "rgba(165,180,252,0.7)"
    : "rgba(201,168,76,0.45)"
  const glowShadow = isThinking
    ? "0 0 40px rgba(165,180,252,0.5), 0 0 80px rgba(165,180,252,0.2)"
    : isSpeaking
    ? "0 0 50px rgba(165,180,252,0.6), 0 0 100px rgba(201,168,76,0.2)"
    : "0 0 30px rgba(201,168,76,0.3), 0 8px 40px rgba(0,0,0,0.7)"

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {/* Stars — hidden on pages that already have them */}
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

      <div style={{ position: "relative", width: size, height: size }}>
        {/* Glow ring — spins faster while channeling */}
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
          {/* Subtle pulse while Simli connects */}
          {!simliReady && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none",
              background: "radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%)",
              animation: "moonPulse 2s ease-in-out infinite",
            }} />
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              position: "absolute", top: "-10%", left: 0,
              width: "100%", height: "120%",
              objectFit: "cover", objectPosition: "center top",
              opacity: faceVisible && simliReady ? 1 : 0,
              zIndex: 1,
              filter: winking
                ? "brightness(0.05)"
                : isSpeaking
                ? "brightness(1.08) contrast(1.05) drop-shadow(0 0 8px rgba(201,168,76,0.3))"
                : "brightness(1) contrast(1.05) saturate(0.9)",
              transition: winking ? "filter 0.06s ease" : "filter 0.12s ease, opacity 1.5s ease",
            }}
          />

          {/* Scan lines over the video */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 3px)",
          }} />

          {/* Vignette */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
            background: "radial-gradient(ellipse at center, transparent 50%, rgba(4,2,14,0.55) 100%)",
          }} />

          {/* Channeling indicator */}
          {isThinking && (
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "8px 6px",
              background: "linear-gradient(to top, rgba(4,2,14,0.85) 0%, transparent 100%)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 5, zIndex: 4,
            }}>
              <div style={{
                display: "flex", gap: 5,
              }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 4, height: 4, borderRadius: "50%", background: "#a5b4fc",
                    animation: "moonPulse 1.2s ease-in-out infinite",
                    animationDelay: `${i * 0.3}s`,
                  }} />
                ))}
              </div>
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 8,
                letterSpacing: "0.25em",
                color: "#a5b4fc",
                opacity: 0.8,
                animation: "moonPulse 2s ease-in-out infinite",
              }}>
                CHANNELING
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simli audio element — Simli IS the speaker, drives both voice and animation */}
      <audio ref={audioRef} autoPlay />

      {/* Name — hidden when the page already shows the title */}
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
