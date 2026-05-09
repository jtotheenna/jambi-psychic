"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import GalileoCircle from "@/components/GalileoCircle"
import MoonWheel from "@/components/MoonWheel"
import { useGalileoVoice } from "@/lib/useGalileoVoice"
import { getMoonData, type MoonData } from "@/lib/moon"

import { speakStreaming } from "@/lib/speak"

function useDraggable() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const origin = useRef({ mx: 0, my: 0, px: 0, py: 0 })

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    origin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
    const move = (e: MouseEvent) => {
      if (!isDragging.current) return
      setPos({ x: origin.current.px + e.clientX - origin.current.mx, y: origin.current.py + e.clientY - origin.current.my })
    }
    const up = () => { isDragging.current = false; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up) }
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
  }, [pos.x, pos.y])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    origin.current = { mx: t.clientX, my: t.clientY, px: pos.x, py: pos.y }
    const move = (e: TouchEvent) => {
      const t = e.touches[0]
      setPos({ x: origin.current.px + t.clientX - origin.current.mx, y: origin.current.py + t.clientY - origin.current.my })
    }
    const up = () => { window.removeEventListener("touchmove", move); window.removeEventListener("touchend", up) }
    window.addEventListener("touchmove", move, { passive: false })
    window.addEventListener("touchend", up)
  }, [pos.x, pos.y])

  return { pos, onMouseDown, onTouchStart }
}

export default function MoonPage() {
  const [moonInfo, setMoonInfo] = useState<MoonData>(() => getMoonData(new Date()))
  const [reading, setReading] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const voice = useGalileoVoice()
  const language = "en"
  const scrollRef = useRef<HTMLDivElement>(null)
  const wheelDrag = useDraggable()
  const simliSendRef = useRef<((pcm: Uint8Array) => void) | null>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [reading])

  // Reading starts automatically when Galileo's face appears after TV static
  // This ensures Simli is ready and he speaks at the right moment
  const handleGalileoReady = useCallback(() => {
    if (!hasEntered) enterReading()
  }, [hasEntered]) // eslint-disable-line react-hooks/exhaustive-deps

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

    voice.setAvatarState("speaking")
    await speakStreaming(data.reading, simliSendRef.current)
    voice.setAvatarState("idle")
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      <Link href="/dashboard" style={{ position: "absolute", top: 24, left: 24, fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7a8ba8", textDecoration: "none", zIndex: 2 }}>
        ← RETURN
      </Link>

      {/* Galileo — fixed top-right, always visible while scrolling, draggable */}
      <div
        onMouseDown={wheelDrag.onMouseDown}
        onTouchStart={wheelDrag.onTouchStart}
        style={{
          position: "fixed",
          top: 64,
          right: 12,
          zIndex: 40,
          transform: `translate(${wheelDrag.pos.x}px, ${wheelDrag.pos.y}px)`,
          cursor: "grab", userSelect: "none", touchAction: "none",
        }}
      >
        <GalileoCircle
          state={hasEntered ? voice.avatarState : "idle"}
          size={180}
          showName={false}
          showStars={false}
          onReady={handleGalileoReady}
          onSendAudio={(fn) => { simliSendRef.current = fn }}
        />
      </div>

      {/* Moon wheel */}
      <div style={{ display: "flex", justifyContent: "center", padding: "48px 24px 16px" }}>
        <div style={{ flexShrink: 0 }}>
          <MoonWheel moonData={moonInfo} />
        </div>
      </div>

      {!hasEntered && (
        <div style={{ textAlign: "center", marginTop: 8, marginBottom: 24 }}>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#2a1a55", fontStyle: "italic", animation: "moonPulse 3s ease-in-out infinite" }}>
            The sky is reading…
          </p>
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
