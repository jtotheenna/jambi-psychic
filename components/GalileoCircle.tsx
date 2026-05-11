"use client"

import { useEffect, useRef, useState } from "react"

type Props = {
  state: "idle" | "thinking" | "speaking" | "closed"
  size?: number
  showName?: boolean
  showStars?: boolean
  onSendAudio?: (fn: (pcm: Uint8Array) => void) => void
  onReady?: () => void
  onSimliConnected?: (isConnected: boolean) => void
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
  const [staticOpacity, setStaticOpacity] = useState(0)
  const [faceVisible,   setFaceVisible]   = useState(false)
  const [internalState, setInternalState] = useState<typeof state>("closed")
  const [simliReady,    setSimliReady]    = useState(false)
  const [effectiveSize, setEffectiveSize] = useState(size)

  const hasOpenedRef         = useRef(false)
  const videoRef             = useRef<HTMLVideoElement>(null)
  const audioRef             = useRef<HTMLAudioElement>(null)
  const clientRef            = useRef<unknown>(null)
  const mountedRef           = useRef(true)
  const simliReadyRef        = useRef(false)       // mirror of simliReady for closures
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSendAudioRef       = useRef(onSendAudio)
  const onSimliConnectedRef  = useRef(onSimliConnected)
  const onReadyRef           = useRef(onReady)

  // Keep prop refs current without triggering effects
  useEffect(() => { onSendAudioRef.current = onSendAudio },      [onSendAudio])
  useEffect(() => { onSimliConnectedRef.current = onSimliConnected }, [onSimliConnected])
  useEffect(() => { onReadyRef.current = onReady },              [onReady])

  // Cap size to viewport width on mobile
  useEffect(() => {
    const update = () => setEffectiveSize(Math.min(size, window.innerWidth * 0.76))
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [size])

  // ── Simli connection with auto-reconnect ──────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true

    async function connect() {
      if (!mountedRef.current) return
      if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null }
      // Tear down any previous client cleanly
      try { (clientRef.current as { stop?: () => void })?.stop?.() } catch { /* ignore */ }
      clientRef.current = null

      function scheduleRetry() {
        if (!mountedRef.current) return
        if (reconnectAttemptsRef.current >= 10) return          // give up after 10 tries
        const delay = Math.min(1500 * Math.pow(1.6, reconnectAttemptsRef.current), 45000)
        reconnectAttemptsRef.current++
        reconnectTimerRef.current = setTimeout(connect, delay)
      }

      try {
        const { SimliClient, generateIceServers } = await import("simli-client")
        const tokenRes = await fetch("/api/simli/token", { method: "POST" })
        if (!tokenRes.ok) { scheduleRetry(); return }
        const { session_token } = await tokenRes.json()
        const iceServers = await generateIceServers("o9f1298cjhpilxszvk193q")
        if (!mountedRef.current) return

        const client = new SimliClient(
          session_token, videoRef.current!, audioRef.current!, iceServers ?? null
        )

        client.on("start", () => {
          if (!mountedRef.current) return
          reconnectAttemptsRef.current = 0          // reset backoff on successful connect
          simliReadyRef.current = true
          setSimliReady(true)
          onSimliConnectedRef.current?.(true)
          // Expose audio sender to parent — re-registered on every reconnect
          if (onSendAudioRef.current) {
            onSendAudioRef.current((pcm: Uint8Array) => {
              const CHUNK = 6000
              for (let offset = 0; offset < pcm.length; offset += CHUNK) {
                (client as { sendAudioData: (d: Uint8Array) => void }).sendAudioData(pcm.slice(offset, offset + CHUNK))
              }
            })
          }
        })

        // Connection dropped or errored → mark not ready and schedule reconnect
        const onDrop = () => {
          if (!mountedRef.current) return
          simliReadyRef.current = false
          setSimliReady(false)
          onSimliConnectedRef.current?.(false)
          scheduleRetry()
        }
        client.on("stop",          onDrop)
        client.on("error",         onDrop)
        client.on("startup_error", onDrop)

        await client.start()
        clientRef.current = client
      } catch {
        scheduleRetry()
      }
    }

    connect()

    // Reconnect when the user returns to the tab
    function handleVisibility() {
      if (document.visibilityState === "visible" && !simliReadyRef.current) {
        reconnectAttemptsRef.current = 0
        connect()
      }
    }
    // Reconnect when network comes back
    function handleOnline() {
      reconnectAttemptsRef.current = 0
      connect()
    }

    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("online", handleOnline)

    return () => {
      mountedRef.current = false
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("online", handleOnline)
      try { (clientRef.current as { stop?: () => void })?.stop?.() } catch { /* ignore */ }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reveal sequence ───────────────────────────────────────────────────────────
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
        onReadyRef.current?.()
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

      {/* Use effectiveSize for layout so the circle never overflows on mobile */}
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
          {/* Living glow — always visible, gives presence even before Simli face loads */}
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

          {/* TV static — reveal only */}
          <CircleStatic opacity={staticOpacity} />

          {/* Idle face loop — shows once /public/galileo-idle.mp4 is recorded.
              Hides silently if file doesn't exist yet. */}
          <video
            src="/galileo-idle.mp4"
            autoPlay
            loop
            muted
            playsInline
            onError={e => { (e.currentTarget as HTMLVideoElement).style.display = "none" }}
            style={{
              position: "absolute", top: "-10%", left: 0,
              width: "100%", height: "120%",
              objectFit: "cover", objectPosition: "center top",
              zIndex: 1,
              opacity: 1,
            }}
          />

          {/* Live Simli feed — always visible once connected */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: "absolute", top: "-10%", left: 0,
              width: "100%", height: "120%",
              objectFit: "cover", objectPosition: "center top",
              opacity: faceVisible && simliReady ? 1 : 0,
              zIndex: 2,
              filter: isSpeaking
                ? "brightness(1.08) contrast(1.05) drop-shadow(0 0 8px rgba(201,168,76,0.3))"
                : "brightness(1) contrast(1.05) saturate(0.9)",
              transition: "filter 0.3s ease, opacity 1.2s ease",
            }}
          />

          {/* Scan lines */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 3px)",
          }} />

          {/* Vignette */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
            background: "radial-gradient(ellipse at center, transparent 50%, rgba(4,2,14,0.55) 100%)",
          }} />
        </div>
      </div>

      <audio ref={audioRef} autoPlay muted />

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
