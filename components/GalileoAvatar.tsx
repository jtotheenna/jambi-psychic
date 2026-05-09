"use client"

import { useEffect, useRef, useState } from "react"

type InternalState = "closed" | "static" | "revealing" | "idle" | "thinking" | "speaking"

type Props = {
  state: "idle" | "thinking" | "speaking" | "closed"
}

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
      const w = canvas.width
      const h = canvas.height
      const imageData = ctx.createImageData(w, h)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const bright = Math.random() > 0.5
          ? 180 + Math.floor(Math.random() * 75)
          : Math.floor(Math.random() * 50)
        data[i] = bright
        data[i + 1] = bright
        data[i + 2] = bright + Math.floor(Math.random() * 40)
        data[i + 3] = 230
      }
      ctx.putImageData(imageData, 0, 0)
      // CRT scan lines
      ctx.fillStyle = "rgba(0,0,0,0.18)"
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1)
      animRef.current = requestAnimationFrame(drawNoise)
    }

    drawNoise()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={176}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity,
        borderRadius: "0 0 10px 10px",
        transition: "opacity 1.2s ease",
        pointerEvents: "none",
        zIndex: 2,
      }}
    />
  )
}

export function GalileoFace({ visible, speaking }: { visible: boolean; speaking: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: visible ? 1 : 0,
        transition: "opacity 1.5s ease",
        zIndex: 1,
      }}
    >
      <div style={{ position: "relative", width: 100, height: 126 }}>

        {/* Turban base — royal purple */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 86,
            height: 46,
            background: "linear-gradient(180deg, #6b21a8 0%, #4c1d95 60%, #2e1065 100%)",
            borderRadius: "43px 43px 0 0",
            border: "1.5px solid rgba(201,168,76,0.5)",
            borderBottom: "none",
            boxShadow: "0 0 12px rgba(107,33,168,0.4)",
          }}
        />
        {/* Turban wrap folds */}
        <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 74, height: 8, background: "rgba(201,168,76,0.15)", borderRadius: 4, border: "1px solid rgba(201,168,76,0.2)" }} />
        <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", width: 66, height: 6, background: "rgba(201,168,76,0.1)", borderRadius: 3, border: "1px solid rgba(201,168,76,0.15)" }} />

        {/* Central gem — ruby red with glow */}
        <div
          style={{
            position: "absolute",
            top: 7,
            left: "50%",
            transform: "translateX(-50%)",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #ff6b6b 0%, #dc2626 45%, #7f1d1d 100%)",
            border: "1.5px solid rgba(201,168,76,0.8)",
            boxShadow: "0 0 10px rgba(220,38,38,0.8), 0 0 20px rgba(220,38,38,0.4), inset 0 1px 2px rgba(255,255,255,0.4)",
            animation: "moonPulse 2.5s ease-in-out infinite",
            zIndex: 2,
          }}
        />

        {/* Face — Jambi green */}
        <div
          style={{
            position: "absolute",
            top: 32,
            left: "50%",
            transform: "translateX(-50%)",
            width: 78,
            height: 72,
            borderRadius: "50% 50% 44% 44%",
            background: "linear-gradient(160deg, #4ade80 0%, #16a34a 50%, #15803d 100%)",
            border: "1.5px solid rgba(201,168,76,0.3)",
            overflow: "hidden",
            boxShadow: "0 0 16px rgba(74,222,128,0.25)",
          }}
        >
          {/* Face highlight */}
          <div
            style={{
              position: "absolute",
              top: -4,
              left: "50%",
              transform: "translateX(-50%)",
              width: 50,
              height: 30,
              background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />

          {/* Eyebrows — thick & arched */}
          {[{ left: "14px" }, { right: "14px" }].map((pos, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: 12,
                ...pos,
                width: 18,
                height: 5,
                background: "#1e3a2f",
                borderRadius: "3px 3px 0 0",
                transform: i === 0 ? "rotate(-8deg)" : "rotate(8deg)",
              }}
            />
          ))}

          {/* Eyes — large, dark with gold irises */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "space-around",
              padding: "0 10px",
            }}
          >
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  width: 18,
                  height: 16,
                  borderRadius: "50%",
                  background: "#0a1f0d",
                  border: "1.5px solid rgba(201,168,76,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 6px rgba(201,168,76,0.3)",
                }}
              >
                <div
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, #fde68a 0%, #c9a84c 50%, #78350f 100%)",
                    boxShadow: "0 0 4px rgba(201,168,76,0.8)",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Nose — round button */}
          <div
            style={{
              position: "absolute",
              top: 40,
              left: "50%",
              transform: "translateX(-50%)",
              width: 10,
              height: 8,
              borderRadius: "50%",
              background: "#15803d",
              border: "1px solid rgba(0,0,0,0.2)",
            }}
          />

          {/* Mouth — wide, animated when speaking */}
          <div
            style={{
              position: "absolute",
              top: 51,
              left: "50%",
              transform: "translateX(-50%)",
              width: speaking ? 30 : 22,
              height: speaking ? 12 : 5,
              borderRadius: "0 0 14px 14px",
              background: "#0a1f0d",
              border: "1px solid rgba(201,168,76,0.3)",
              transition: "all 0.15s ease",
              animation: speaking ? "breathe 0.35s ease-in-out infinite" : "none",
              overflow: "hidden",
            }}
          >
            {/* Teeth flash when speaking */}
            {speaking && (
              <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 20, height: 5, background: "rgba(255,255,255,0.85)", borderRadius: "0 0 2px 2px" }} />
            )}
          </div>

          {/* Rosy cheeks */}
          {[{ left: "6px" }, { right: "6px" }].map((pos, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: 38,
                ...pos,
                width: 14,
                height: 9,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.25)",
              }}
            />
          ))}
        </div>

        {/* Floating stars beside face */}
        {[-34, 34].map((x, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 50,
              left: `calc(50% + ${x}px)`,
              fontSize: 9,
              color: "#c9a84c",
              opacity: 0.6,
              animation: `starFloat ${4 + i * 1.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.9}s`,
            }}
          >
            ✦
          </div>
        ))}
      </div>
    </div>
  )
}

export default function GalileoAvatar({ state }: Props) {
  const [internalState, setInternalState] = useState<InternalState>("closed")
  const [staticOpacity, setStaticOpacity] = useState(0)
  const [faceVisible, setFaceVisible] = useState(false)
  const [lidOpen, setLidOpen] = useState(false)
  const hasOpenedRef = useRef(false)

  useEffect(() => {
    if (state === "closed") {
      setFaceVisible(false)
      setStaticOpacity(0)
      setTimeout(() => setLidOpen(false), 300)
      setInternalState("closed")
      hasOpenedRef.current = false
      return
    }

    // First time opening — run the full TV static reveal sequence
    if (!hasOpenedRef.current) {
      hasOpenedRef.current = true
      setLidOpen(true)
      setInternalState("static")

      setTimeout(() => setStaticOpacity(1), 600)
      setTimeout(() => setStaticOpacity(0), 2200)
      setTimeout(() => {
        setFaceVisible(true)
        setInternalState(state)
      }, 3200)
    } else {
      setInternalState(state)
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  const isGlowing = internalState === "thinking" || internalState === "speaking"

  return (
    <div className="flex flex-col items-center select-none">
      {/* Stars above */}
      <div className="flex gap-6 mb-3 h-8 items-end">
        {["★", "✦", "★"].map((s, i) => (
          <span
            key={i}
            className="animate-star-float"
            style={{
              animationDelay: `${i * 0.8}s`,
              fontSize: i === 1 ? "18px" : "12px",
              color: i === 1 ? "#f0cc6e" : "#c9a84c",
              opacity: 0.5,
            }}
          >
            {s}
          </span>
        ))}
      </div>

      <div style={{ width: 220, perspective: "600px" }}>
        {/* Lid */}
        <div
          style={{
            height: 50,
            transformOrigin: "bottom center",
            transformStyle: "preserve-3d",
            transform: lidOpen ? "rotateX(-110deg)" : "rotateX(0deg)",
            transition: "transform 0.9s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(180deg, #1e1048 0%, #1a0d3f 100%)",
              border: `2px solid ${isGlowing ? "rgba(165,180,252,0.6)" : "rgba(201,168,76,0.4)"}`,
              borderBottom: "none",
              borderRadius: "8px 8px 0 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "border-color 0.5s ease",
            }}
          >
            <span style={{ fontSize: 9, color: "rgba(201,168,76,0.6)" }}>✦</span>
            <span style={{ fontSize: 22, color: "#c8d4e8", textShadow: "0 0 8px rgba(200,212,232,0.5)" }}>☽</span>
            <span style={{ fontSize: 9, color: "rgba(201,168,76,0.6)" }}>✦</span>
          </div>
        </div>

        {/* Box body */}
        <div
          className={isGlowing ? "animate-thinking" : "animate-glow-pulse"}
          style={{
            height: 180,
            background: "linear-gradient(180deg, #1a0d3f 0%, #0d0621 100%)",
            border: `2px solid ${isGlowing ? "rgba(165,180,252,0.6)" : "rgba(201,168,76,0.4)"}`,
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            position: "relative",
            overflow: "hidden",
            transition: "border-color 0.5s ease",
          }}
        >
          {/* Velvet interior */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at 50% 30%, rgba(79,70,229,0.35) 0%, rgba(10,5,32,0.95) 70%)",
            }}
          />

          {/* TV Static overlay */}
          <TVStatic opacity={staticOpacity} />

          {/* Galileo photo — fades in after static */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/galileo.jpg"
            alt="Galileo"
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "contain", objectPosition: "center center",
              background: "#04020e",
              opacity: faceVisible ? 1 : 0,
              transition: "opacity 1.5s ease",
              zIndex: 1,
              filter: internalState === "speaking"
                ? "brightness(1.08) drop-shadow(0 0 8px rgba(201,168,76,0.3))"
                : "brightness(1)",
            }}
          />

          {/* CSS face fallback if photo fails */}
          <GalileoFace visible={faceVisible} speaking={internalState === "speaking"} />

          {/* Thinking dots */}
          {internalState === "thinking" && (
            <div
              style={{
                position: "absolute",
                bottom: 10,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                gap: 6,
                zIndex: 3,
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#a5b4fc",
                    animation: "moonPulse 1.2s ease-in-out infinite",
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Corner ornaments */}
          {[
            { top: "8px", left: "8px" },
            { top: "8px", right: "8px" },
            { bottom: "8px", left: "8px" },
            { bottom: "8px", right: "8px" },
          ].map((pos, i) => (
            <div key={i} style={{ position: "absolute", ...pos, fontSize: 10, color: "rgba(201,168,76,0.4)", zIndex: 3 }}>
              ◆
            </div>
          ))}

        </div>
      </div>

      {/* Name */}
      <div className="mt-4 text-center">
        <div
          style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 18, letterSpacing: "0.15em" }}
          className="text-shimmer"
        >
          GALILEO
        </div>
        <div
          style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.2em", color: "#7a8ba8", marginTop: 2 }}
        >
          THE CELESTIAL ORACLE
        </div>
      </div>
    </div>
  )
}
