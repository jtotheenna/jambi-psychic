"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"

function playAudio(src: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(src)
    const done = () => { URL.revokeObjectURL(src); resolve() }
    audio.onended = done
    audio.onerror = done
    audio.play().catch(done)
  })
}

async function fetchTTS(text: string): Promise<string | null> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
    if (!res.ok || res.status === 204) return null
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  } catch { return null }
}

type Phase = "upload" | "reading" | "done"

export default function PalmPage() {
  const [phase, setPhase] = useState<Phase>("upload")
  const [preview, setPreview] = useState<string | null>(null)
  const [reading, setReading] = useState("")
  const [speaking, setSpeaking] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    // Resize to max 1024px before storing to keep payload small
    const img = document.createElement("img")
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1024
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
      setPreview(canvas.toDataURL("image/jpeg", 0.85))
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [])

  async function submitPalm() {
    if (!preview) return
    setPhase("reading")

    const [, data] = preview.split(",")

    const res = await fetch("/api/palm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: data, mimeType: "image/jpeg" }),
    })

    if (!res.ok) { setPhase("upload"); return }
    const json = await res.json()

    setReading(json.reading)
    setPhase("done")

    // Speak the reading
    setSpeaking(true)
    const audio = await fetchTTS(json.reading)
    if (audio) await playAudio(audio)
    setSpeaking(false)
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative", zIndex: 1 }}>

      <Link href="/dashboard" style={{ position: "absolute", top: 24, left: 24, fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7a8ba8", textDecoration: "none" }}>
        ← RETURN
      </Link>

      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✋</div>
        <h1 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 22, letterSpacing: "0.12em" }} className="text-shimmer">
          READ MY PALM
        </h1>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: "#7a8ba8", fontStyle: "italic", marginTop: 8 }}>
          Hold your hand open, palm facing up. Good light. A clear photo.
        </p>
      </div>

      {phase === "upload" && (
        <div style={{ width: "100%", maxWidth: 480 }}>
          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            style={{
              border: `2px dashed ${dragOver ? "rgba(165,180,252,0.7)" : "rgba(42,26,85,0.7)"}`,
              borderRadius: 16,
              padding: preview ? 0 : "48px 24px",
              cursor: "pointer",
              background: dragOver ? "rgba(79,70,229,0.08)" : "rgba(10,5,32,0.4)",
              transition: "all 0.2s ease",
              overflow: "hidden",
              position: "relative",
              minHeight: preview ? 320 : undefined,
            }}
          >
            {preview ? (
              <>
                <Image src={preview} alt="Your palm" fill style={{ objectFit: "contain" }} sizes="480px" />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 70%, rgba(4,2,14,0.9) 100%)" }} />
                <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", color: "#7a8ba8" }}>
                  TAP TO CHANGE
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>☽</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.2em", color: "#7a8ba8", marginBottom: 8 }}>
                  TAP TO UPLOAD
                </div>
                <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#4a3870", fontStyle: "italic" }}>
                  or drag your photo here
                </div>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />

          {preview && (
            <button
              onClick={submitPalm}
              style={{
                marginTop: 20,
                width: "100%",
                padding: "16px",
                borderRadius: 8,
                border: "1px solid rgba(201,168,76,0.5)",
                background: "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(79,70,229,0.12) 100%)",
                color: "#c9a84c",
                fontFamily: "'Cinzel', serif",
                fontSize: 13,
                letterSpacing: "0.2em",
                cursor: "pointer",
              }}
            >
              READ MY PALM ✦
            </button>
          )}
        </div>
      )}

      {phase === "reading" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, animation: "moonPulse 1.5s ease-in-out infinite", marginBottom: 20 }}>☽</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", color: "#a5b4fc" }}>
            GALILEO IS READING YOUR HAND...
          </div>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#4a3870", fontStyle: "italic", marginTop: 12, maxWidth: 320 }}>
            He has seen ten thousand palms. He is taking his time with yours.
          </p>
        </div>
      )}

      {phase === "done" && (
        <div style={{ maxWidth: 640, width: "100%" }}>
          {/* Thumb image */}
          {preview && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(201,168,76,0.4)", position: "relative" }}>
                <Image src={preview} alt="Your palm" fill style={{ objectFit: "cover" }} sizes="80px" />
              </div>
            </div>
          )}

          <div
            style={{
              padding: 32,
              borderRadius: 16,
              border: "1px solid rgba(201,168,76,0.2)",
              background: "linear-gradient(135deg, rgba(26,13,63,0.9) 0%, rgba(10,5,32,0.9) 100%)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 18, color: speaking ? "#a5b4fc" : "#c9a84c", animation: speaking ? "moonPulse 1s ease-in-out infinite" : "none" }}>
                {speaking ? "◉" : "☽"}
              </div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: speaking ? "#a5b4fc" : "#7a8ba8" }}>
                {speaking ? "GALILEO IS SPEAKING..." : "GALILEO"}
              </div>
            </div>

            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: "#ddd8f0", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
              {reading}
            </div>
          </div>

          <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => { setPhase("upload"); setPreview(null); setReading("") }}
              style={{
                padding: "10px 28px", borderRadius: 8,
                border: "1px solid rgba(42,26,85,0.6)",
                background: "rgba(10,5,32,0.4)",
                color: "#7a8ba8", fontFamily: "'Cinzel', serif", fontSize: 10,
                letterSpacing: "0.15em", cursor: "pointer",
              }}
            >
              READ AGAIN
            </button>
            <Link
              href="/dashboard"
              style={{
                padding: "10px 28px", borderRadius: 8,
                border: "1px solid rgba(201,168,76,0.3)",
                background: "rgba(201,168,76,0.08)",
                color: "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 10,
                letterSpacing: "0.15em", textDecoration: "none", display: "inline-block",
              }}
            >
              RETURN ✦
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
