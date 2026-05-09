"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import GalileoPanel from "@/components/GalileoPanel"
import { useGalileoVoice } from "@/lib/useGalileoVoice"

import { speakStreaming } from "@/lib/speak"

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1024
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement("canvas")
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL("image/jpeg", 0.82).split(",")[1])
    }
    img.onerror = reject
    img.src = url
  })
}

export default function PalmPage() {
  const [reading, setReading] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const simliSendRef = useRef<((pcm: Uint8Array) => void) | null>(null)
  const voice = useGalileoVoice()
  const language = "en"

  const speakWithSimli = useCallback(async (text: string) => {
    voice.setAvatarState("speaking")
    await speakStreaming(text, simliSendRef.current)
    voice.setAvatarState("idle")
  }, [voice])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { setImageError("Please select an image file."); return }
    setImageError("")
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function startReading() {
    if (!imageFile) { setImageError("Please upload a photo of your hand first."); return }

    const silentAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    silentAudio.volume = 0
    silentAudio.play().catch(() => {})

    setHasStarted(true)
    voice.open()
    setLoading(true)
    voice.setLoading(true)

    let imageData: string | null = null
    try { imageData = await compressImage(imageFile) } catch { /* proceed without image */ }

    const res = await fetch("/api/palm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "__OPENING__", imageData, voiceMode: voice.mode === "conversational", language }),
    })
    const data = await res.json()
    if (!res.ok) { setLoading(false); voice.setLoading(false); return }

    setReading(data.reading)
    setIsComplete(true)
    voice.setLoading(false)
    setLoading(false)

    await speakWithSimli(data.reading)
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(42,26,85,0.5)" }}>
        <Link href="/dashboard" style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7a8ba8", textDecoration: "none" }}>← RETURN</Link>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#c9a84c" }}>✋ PALM READING</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

        <div style={{ display: "flex", justifyContent: "center", position: "sticky", top: 57, zIndex: 30, background: "rgba(4,2,14,0.93)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(42,26,85,0.4)", padding: "10px 0" }}>
          <GalileoPanel
            avatarState={hasStarted ? voice.avatarState : "closed"}
            hasStarted={hasStarted}
            mode={voice.mode}
            setMode={voice.setMode}
            isListening={voice.isListening}
            interimTranscript={voice.interimTranscript}
            voiceSupported={voice.voiceSupported}
            startOpen
            onSendAudio={(fn) => { simliSendRef.current = fn }}
          />
        </div>

        {/* Upload screen */}
        {!hasStarted && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: "#c8d4e8", fontStyle: "italic", textAlign: "center", maxWidth: 460 }}>
              Hold your dominant hand open, palm facing up, in natural light. Take a photo and let Galileo read what is written there.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ width: "100%", maxWidth: 400, minHeight: 180, borderRadius: 12, border: `2px dashed ${imagePreview ? "rgba(201,168,76,0.5)" : "rgba(42,26,85,0.7)"}`, background: imagePreview ? "rgba(10,5,32,0.8)" : "rgba(10,5,32,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", transition: "border-color 0.3s" }}
            >
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Your hand" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
              ) : (
                <div style={{ textAlign: "center", padding: 24 }}>
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>✋</div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#4a3870" }}>TAP TO UPLOAD YOUR HAND</div>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: "none" }} />
            {imageError && <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#be123c" }}>{imageError}</div>}

            <button
              onClick={startReading}
              disabled={!imageFile || loading}
              style={{ padding: "14px 48px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.5)", background: imageFile ? "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(79,70,229,0.15))" : "rgba(42,26,85,0.3)", color: imageFile ? "#c9a84c" : "#4a3870", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", cursor: imageFile ? "pointer" : "not-allowed" }}
            >
              {loading ? "GALILEO IS READING..." : "READ MY HAND ✦"}
            </button>
          </div>
        )}

        {/* Loading dots */}
        {loading && hasStarted && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "24px 0" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#c9a84c", animation: "moonPulse 1.2s ease-in-out infinite", animationDelay: `${i*0.3}s` }} />
            ))}
          </div>
        )}

        {/* Reading */}
        {reading && (
          <div>
            <div style={{ padding: "28px 32px", borderRadius: 12, border: "1px solid rgba(201,168,76,0.15)", background: "linear-gradient(135deg, rgba(26,13,63,0.9), rgba(10,5,32,0.9))", backdropFilter: "blur(8px)" }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.25em", color: "#7a8ba8", marginBottom: 16 }}>
                ✋ YOUR PALM READING
              </div>
              {reading.split("\n\n").map((para, i) => (
                <p key={i} style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, lineHeight: 1.85, color: "#ddd8f0", marginBottom: i < reading.split("\n\n").length - 1 ? 20 : 0 }}>
                  {para}
                </p>
              ))}
            </div>

            {isComplete && (
              <div style={{ textAlign: "center", marginTop: 28 }}>
                <Link href="/dashboard" style={{ padding: "10px 28px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.06)", color: "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", textDecoration: "none" }}>
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
