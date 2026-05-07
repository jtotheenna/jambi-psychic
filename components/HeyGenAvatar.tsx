"use client"

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react"
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
} from "@heygen/streaming-avatar"

export type HeyGenAvatarHandle = {
  speak: (text: string) => Promise<void>
  interrupt: () => Promise<void>
}

type Props = {
  state: "idle" | "thinking" | "speaking" | "closed"
  onSpeakEnd?: () => void
}

// Real canvas TV static — same as GalileoAvatar
function TVStatic({ opacity }: { opacity: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    function drawNoise() {
      if (!canvas || !ctx) return
      const imageData = ctx.createImageData(canvas.width, canvas.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const bright = Math.random() > 0.5
          ? 180 + Math.floor(Math.random() * 75)
          : Math.floor(Math.random() * 50)
        data[i] = bright; data[i + 1] = bright
        data[i + 2] = bright + Math.floor(Math.random() * 40)
        data[i + 3] = 230
      }
      ctx.putImageData(imageData, 0, 0)
      ctx.fillStyle = "rgba(0,0,0,0.18)"
      for (let y = 0; y < canvas.height; y += 3) ctx.fillRect(0, y, canvas.width, 1)
      animRef.current = requestAnimationFrame(drawNoise)
    }

    drawNoise()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <canvas ref={canvasRef} width={220} height={220}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, transition: "opacity 1.2s ease", pointerEvents: "none", zIndex: 2 }}
    />
  )
}

export const HeyGenAvatar = forwardRef<HeyGenAvatarHandle, Props>(
  function HeyGenAvatar({ state, onSpeakEnd }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const avatarRef = useRef<StreamingAvatar | null>(null)
    const [ready, setReady] = useState(false)
    const [heygenError, setHeygenError] = useState<string | null>(null)
    const [lidOpen, setLidOpen] = useState(false)
    const [staticOpacity, setStaticOpacity] = useState(0)
    const [faceVisible, setFaceVisible] = useState(false)
    const hasOpenedRef = useRef(false)

    const isGlowing = state === "thinking" || state === "speaking"

    useImperativeHandle(ref, () => ({
      async speak(text: string) {
        if (!avatarRef.current || !ready || heygenError) return
        try {
          await avatarRef.current.speak({ text, taskType: TaskType.TALK })
        } catch (e) {
          console.error("HeyGen speak error:", e)
          onSpeakEnd?.()
        }
      },
      async interrupt() {
        try { await avatarRef.current?.interrupt() } catch {}
      },
    }))

    useEffect(() => {
      if (state === "closed" || hasOpenedRef.current) return
      hasOpenedRef.current = true

      // Box open sequence
      setLidOpen(true)
      setTimeout(() => setStaticOpacity(1), 600)
      setTimeout(() => setStaticOpacity(0), 2400)
      setTimeout(() => setFaceVisible(true), 3400)

      async function init() {
        try {
          const tokenRes = await fetch("/api/heygen/token", { method: "POST" })
          if (!tokenRes.ok) throw new Error(`Token request failed: ${tokenRes.status}`)
          const { token, error: tokenErr } = await tokenRes.json()
          if (tokenErr) throw new Error(tokenErr)

          const avatar = new StreamingAvatar({ token })
          avatarRef.current = avatar

          avatar.on(StreamingEvents.STREAM_READY, (e: CustomEvent) => {
            if (videoRef.current && e.detail) {
              videoRef.current.srcObject = e.detail
              videoRef.current.play().catch(console.error)
            }
            setReady(true)
          })

          avatar.on(StreamingEvents.AVATAR_END_MESSAGE, () => {
            onSpeakEnd?.()
          })

          avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
            setHeygenError("stream disconnected")
          })

          await avatar.createStartAvatar({
            quality: AvatarQuality.High,
            avatarName: process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID!,
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          console.error("HeyGen init error:", msg)
          setHeygenError(msg)
          setReady(true)
          onSpeakEnd?.() // don't leave stuck in speaking state
        }
      }

      init()

      return () => {
        avatarRef.current?.stopAvatar().catch(() => {})
      }
    }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <div className="flex flex-col items-center select-none">
        <div className="flex gap-6 mb-3 h-8 items-end">
          {["★", "✦", "★"].map((s, i) => (
            <span key={i} style={{
              animation: `starFloat 6s ease-in-out ${i * 0.8}s infinite`,
              fontSize: i === 1 ? "18px" : "12px",
              color: i === 1 ? "#f0cc6e" : "#c9a84c",
              opacity: 0.5,
            }}>
              {s}
            </span>
          ))}
        </div>

        <div style={{ width: 220, perspective: "600px" }}>
          {/* Lid */}
          <div style={{
            height: 50, transformOrigin: "bottom center", transformStyle: "preserve-3d",
            transform: lidOpen ? "rotateX(-110deg)" : "rotateX(0deg)",
            transition: "transform 0.9s cubic-bezier(0.4,0,0.2,1)",
          }}>
            <div style={{
              width: "100%", height: "100%",
              background: "linear-gradient(180deg, #1e1048 0%, #1a0d3f 100%)",
              borderTop: `2px solid ${isGlowing ? "rgba(165,180,252,0.6)" : "rgba(201,168,76,0.4)"}`,
              borderLeft: `2px solid ${isGlowing ? "rgba(165,180,252,0.6)" : "rgba(201,168,76,0.4)"}`,
              borderRight: `2px solid ${isGlowing ? "rgba(165,180,252,0.6)" : "rgba(201,168,76,0.4)"}`,
              borderBottom: "none", borderRadius: "8px 8px 0 0",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "border-color 0.5s ease",
            }}>
              <span style={{ fontSize: 9, color: "rgba(201,168,76,0.6)" }}>✦</span>
              <span style={{ fontSize: 22, color: "#c8d4e8", textShadow: "0 0 8px rgba(200,212,232,0.5)" }}>☽</span>
              <span style={{ fontSize: 9, color: "rgba(201,168,76,0.6)" }}>✦</span>
            </div>
          </div>

          {/* Box body */}
          <div className={isGlowing ? "animate-thinking" : "animate-glow-pulse"}
            style={{
              height: 220, position: "relative", overflow: "hidden",
              background: "linear-gradient(180deg, #1a0d3f 0%, #0d0621 100%)",
              borderTop: "none",
              borderLeft: `2px solid ${isGlowing ? "rgba(165,180,252,0.6)" : "rgba(201,168,76,0.4)"}`,
              borderRight: `2px solid ${isGlowing ? "rgba(165,180,252,0.6)" : "rgba(201,168,76,0.4)"}`,
              borderBottom: `2px solid ${isGlowing ? "rgba(165,180,252,0.6)" : "rgba(201,168,76,0.4)"}`,
              borderRadius: "0 0 12px 12px",
              transition: "border-color 0.5s ease",
            }}>

            {/* Velvet bg */}
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(79,70,229,0.35) 0%, rgba(10,5,32,0.95) 70%)" }} />

            {/* TV Static canvas */}
            <TVStatic opacity={staticOpacity} />

            {/* HeyGen live video */}
            <video ref={videoRef} autoPlay playsInline
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover", objectPosition: "center top",
                opacity: faceVisible && !heygenError ? 1 : 0,
                transition: "opacity 1.5s ease", zIndex: 1,
              }}
            />

            {/* Fallback: galileo.jpg when HeyGen fails */}
            {heygenError && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/galileo.jpg" alt="Galileo"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  objectFit: "cover", objectPosition: "center top",
                  opacity: faceVisible ? 1 : 0, transition: "opacity 1.5s ease", zIndex: 1,
                }}
              />
            )}

            {/* Dev error hint */}
            {heygenError && faceVisible && process.env.NODE_ENV !== "production" && (
              <div style={{ position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center", fontFamily: "monospace", fontSize: 8, color: "rgba(190,18,60,0.7)", zIndex: 4, padding: "0 4px" }}>
                {heygenError.slice(0, 40)}
              </div>
            )}

            {/* Thinking dots */}
            {state === "thinking" && (
              <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6, zIndex: 3 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#a5b4fc", animation: "moonPulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.3}s` }} />
                ))}
              </div>
            )}

            {[{ top: "8px", left: "8px" }, { top: "8px", right: "8px" }, { bottom: "8px", left: "8px" }, { bottom: "8px", right: "8px" }]
              .map((pos, i) => (
                <div key={i} style={{ position: "absolute", ...pos, fontSize: 10, color: "rgba(201,168,76,0.4)", zIndex: 3 }}>◆</div>
              ))}

            <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", fontSize: 18, color: "rgba(201,168,76,0.5)", zIndex: 3 }}>✦</div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 18, letterSpacing: "0.15em" }} className="text-shimmer">
            GALILEO
          </div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.2em", color: "#7a8ba8", marginTop: 2 }}>
            THE CELESTIAL ORACLE
          </div>
        </div>
      </div>
    )
  }
)
