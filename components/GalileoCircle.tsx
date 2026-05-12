"use client"

import { useEffect, useRef, useState } from "react"

type Props = {
  state: "idle" | "thinking" | "speaking" | "closed"
  size?: number
  showName?: boolean
  showStars?: boolean
}

export default function GalileoCircle({ state, size = 200, showName = true, showStars = true }: Props) {
  const [internalState, setInternalState] = useState<typeof state>("idle")
  const [simliReady,    setSimliReady]    = useState(false)
  const [videoPlaying,  setVideoPlaying]  = useState(false)
  const [effectiveSize, setEffectiveSize] = useState(size)

  const videoRef         = useRef<HTMLVideoElement>(null)
  const audioRef         = useRef<HTMLAudioElement>(null)
  const clientRef        = useRef<unknown>(null)
  const mountedRef       = useRef(true)
  const simliReadyRef    = useRef(false)
  const reconnectRef     = useRef(0)
  const reconnectTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cap size on mobile
  useEffect(() => {
    const update = () => setEffectiveSize(Math.min(size, window.innerWidth * 0.76))
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [size])

  // Keep internalState in sync
  useEffect(() => { setInternalState(state) }, [state])

  // Simli connection — idle only, no audio sent, so no mouth movement
  useEffect(() => {
    mountedRef.current = true

    async function connect() {
      if (!mountedRef.current) return
      if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null }
      try { (clientRef.current as { stop?: () => void })?.stop?.() } catch { /* ignore */ }
      clientRef.current = null

      function scheduleRetry() {
        if (!mountedRef.current) return
        if (reconnectRef.current >= 10) return
        const delay = Math.min(1500 * Math.pow(1.6, reconnectRef.current), 30000)
        reconnectRef.current++
        reconnectTimer.current = setTimeout(connect, delay)
      }

      try {
        const { SimliClient, generateIceServers } = await import("simli-client")
        const tokenRes = await fetch("/api/simli/token", { method: "POST" })
        if (!tokenRes.ok) { scheduleRetry(); return }
        const { session_token } = await tokenRes.json()
        const iceServers = await generateIceServers("o9f1298cjhpilxszvk193q")
        if (!mountedRef.current) return

        const client = new SimliClient(session_token, videoRef.current!, audioRef.current!, iceServers ?? null)

        client.on("start", () => {
          if (!mountedRef.current) return
          reconnectRef.current = 0
          simliReadyRef.current = true
          setSimliReady(true)
        })

        const onDrop = () => {
          if (!mountedRef.current) return
          simliReadyRef.current = false
          setSimliReady(false)
          setVideoPlaying(false)
          scheduleRetry()
        }
        client.on("stop",          onDrop)
        client.on("error",         onDrop)
        client.on("startup_error", onDrop)

        await client.start()
        clientRef.current = client
      } catch { scheduleRetry() }
    }

    connect()

    const onVisible = () => { if (document.visibilityState === "visible" && !simliReadyRef.current) { reconnectRef.current = 0; connect() } }
    const onOnline  = () => { reconnectRef.current = 0; connect() }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("online", onOnline)

    return () => {
      mountedRef.current = false
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("online", onOnline)
      try { (clientRef.current as { stop?: () => void })?.stop?.() } catch { /* ignore */ }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isThinking = internalState === "thinking"
  const isSpeaking = internalState === "speaking"
  const glowColor  = isThinking || isSpeaking ? "rgba(165,180,252,0.7)" : "rgba(201,168,76,0.45)"
  const glowShadow = isThinking
    ? "0 0 40px rgba(165,180,252,0.5), 0 0 80px rgba(165,180,252,0.2)"
    : isSpeaking
    ? "0 0 50px rgba(165,180,252,0.6), 0 0 100px rgba(201,168,76,0.2)"
    : "0 0 30px rgba(201,168,76,0.3), 0 8px 40px rgba(0,0,0,0.7)"

  // Live Simli feed is visible — no sending audio, so just natural idle blinking
  const showLive = simliReady && videoPlaying

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

        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          overflow: "hidden",
          border: `2px solid ${glowColor}`,
          boxShadow: glowShadow,
          transition: "box-shadow 0.5s ease, border-color 0.5s ease",
          background: "#04020e",
        }}>
          {/* Background glow */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 0,
            background: isThinking
              ? "radial-gradient(ellipse 90% 95% at 50% 45%, rgba(79,70,229,0.55) 0%, rgba(124,58,237,0.3) 35%, transparent 85%)"
              : isSpeaking
              ? "radial-gradient(ellipse 90% 95% at 50% 45%, rgba(201,168,76,0.4) 0%, rgba(79,70,229,0.25) 35%, transparent 85%)"
              : "radial-gradient(ellipse 90% 95% at 50% 45%, rgba(79,70,229,0.38) 0%, rgba(124,58,237,0.18) 35%, transparent 85%)",
            animation: isThinking ? "glowPulse 1.4s ease-in-out infinite" : isSpeaking ? "glowPulse 0.9s ease-in-out infinite" : "glowPulse 4s ease-in-out infinite",
            transition: "background 0.6s ease",
          }} />

          {/* Static jpg — shows instantly, hidden once Simli live kicks in */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/galileo.jpg"
            alt=""
            style={{
              position: "absolute", top: "-10%", left: 0,
              width: "100%", height: "120%",
              objectFit: "cover", objectPosition: "center top",
              zIndex: 1,
              opacity: showLive ? 0 : 1,
              transition: "opacity 0.8s ease",
            }}
          />

          {/* Simli live — fades in as soon as frames arrive, natural idle blinking */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onPlaying={() => setVideoPlaying(true)}
            style={{
              position: "absolute", top: "-10%", left: 0,
              width: "100%", height: "120%",
              objectFit: "cover", objectPosition: "center top",
              zIndex: 2,
              opacity: showLive ? 1 : 0,
              transition: "opacity 0.8s ease",
              filter: "brightness(1.02) contrast(1.03) saturate(0.95)",
            }}
          />

          {/* Scan lines */}
          <div style={{ position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 3px)" }} />
          {/* Vignette */}
          <div style={{ position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 50%, rgba(4,2,14,0.55) 100%)" }} />
        </div>
      </div>

      <audio ref={audioRef} autoPlay muted />

      {showName && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 18, letterSpacing: "0.15em" }} className="text-shimmer">GALILEO</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.2em", color: "#7a8ba8", marginTop: 2 }}>THE CELESTIAL ORACLE</div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
