"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { useGalileoVoice } from "@/lib/useGalileoVoice"
import { getStoredLanguage } from "@/lib/language"
import { speakStreaming } from "@/lib/speak"
import GalileoPanel from "@/components/GalileoPanel"

// ── Color extraction ────────────────────────────────────────────────────────

const AURA_COLORS: { name: string; hex: string; hMin: number; hMax: number; sMin?: number; lMin?: number; lMax?: number }[] = [
  { name: "Obsidian",        hex: "#1a0d3f", hMin: 0,   hMax: 360, sMin: 0, lMax: 10 },
  { name: "Luminous White",  hex: "#f0f4ff", hMin: 0,   hMax: 360, sMin: 0, lMin: 92 },
  { name: "Silver",          hex: "#c8d4e8", hMin: 0,   hMax: 360, sMin: 0, lMin: 55, lMax: 91 },
  { name: "Charcoal",        hex: "#374151", hMin: 0,   hMax: 360, sMin: 0, lMin: 10, lMax: 30 },
  { name: "Crimson",         hex: "#dc2626", hMin: 345, hMax: 360 },
  { name: "Crimson",         hex: "#dc2626", hMin: 0,   hMax: 15  },
  { name: "Amber",           hex: "#d97706", hMin: 15,  hMax: 38  },
  { name: "Gold",            hex: "#c9a84c", hMin: 38,  hMax: 55  },
  { name: "Emerald",         hex: "#10b981", hMin: 55,  hMax: 165 },
  { name: "Aquamarine",      hex: "#06b6d4", hMin: 165, hMax: 200 },
  { name: "Cobalt",          hex: "#3b82f6", hMin: 200, hMax: 240 },
  { name: "Indigo",          hex: "#4f46e5", hMin: 240, hMax: 265 },
  { name: "Violet",          hex: "#7c3aed", hMin: 265, hMax: 295 },
  { name: "Magenta",         hex: "#a855f7", hMin: 295, hMax: 325 },
  { name: "Rose",            hex: "#e879a0", hMin: 325, hMax: 345 },
]

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r/255, gn = g/255, bn = b/255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = d / (1 - Math.abs(2*l - 1))
  let h = 0
  if (max === rn) h = ((gn - bn) / d + 6) % 6
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  return { h: h * 60, s, l }
}

function classifyPixel(r: number, g: number, b: number): string {
  const { h, s, l } = rgbToHsl(r, g, b)
  for (const c of AURA_COLORS) {
    const inHue = c.hMin <= c.hMax ? (h >= c.hMin && h < c.hMax) : (h >= c.hMin || h < c.hMax)
    const inS = c.sMin === undefined || s >= c.sMin / 100
    const inLMin = c.lMin === undefined || l * 100 >= c.lMin
    const inLMax = c.lMax === undefined || l * 100 <= c.lMax
    if (inHue && inS && inLMin && inLMax) return c.name
  }
  return "Silver"
}

function extractColors(img: HTMLImageElement): { name: string; hex: string; percentage: number }[] {
  const MAX = 120
  const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.round(img.naturalWidth * scale)
  const h = Math.round(img.naturalHeight * scale)
  const canvas = document.createElement("canvas")
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)
  const counts: Record<string, number> = {}
  for (let i = 0; i < data.length; i += 4) {
    if (data[i+3] < 128) continue
    const name = classifyPixel(data[i], data[i+1], data[i+2])
    counts[name] = (counts[name] || 0) + 1
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const hexMap: Record<string, string> = {}
  AURA_COLORS.forEach(c => { hexMap[c.name] = c.hex })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, n]) => ({ name, hex: hexMap[name] ?? "#7c3aed", percentage: Math.round((n / total) * 100) }))
    .filter(c => c.percentage >= 3)
}

// ── Aura glow renderer ───────────────────────────────────────────────────────

function buildAuraGlow(colors: { hex: string; percentage: number }[]): string {
  // Layer box-shadows using the dominant colors — outer layers are more diffuse
  const layers = colors.slice(0, 4).map((c, i) => {
    const spread = 8 + i * 6
    const blur = 24 + i * 28
    const alpha = Math.max(0.15, (c.percentage / 100) * 1.4 - i * 0.15)
    const hex = c.hex
    return `0 0 ${blur}px ${spread}px ${hex}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`
  })
  return layers.join(", ")
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AuraPage() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [detectedColors, setDetectedColors] = useState<{ name: string; hex: string; percentage: number }[]>([])
  const [auraGlow, setAuraGlow] = useState("")
  const [reading, setReading] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [imageError, setImageError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const simliSendRef = useRef<((pcm: Uint8Array) => void) | null>(null)
  const voice = useGalileoVoice()
  const language = typeof window !== "undefined" ? getStoredLanguage() : "en"

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { setImageError("Please select an image file."); return }
    setImageError("")
    setImageFile(file)
    setDetectedColors([])
    setAuraGlow("")

    const src = URL.createObjectURL(file)
    setImagePreview(src)

    // Extract colors once image loads
    const img = new Image()
    img.onload = () => {
      const colors = extractColors(img)
      setDetectedColors(colors)
      setAuraGlow(buildAuraGlow(colors))
      URL.revokeObjectURL(src)
    }
    img.src = src
  }

  async function startReading() {
    if (!imageFile || loading) return
    const sa = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    sa.volume = 0; sa.play().catch(() => {})

    setHasStarted(true)
    setLoading(true)
    voice.open()
    voice.setAvatarState("thinking")

    // Compress image
    let imageData: string | null = null
    try {
      const img = new Image()
      await new Promise<void>(resolve => {
        img.onload = () => resolve()
        img.src = URL.createObjectURL(imageFile)
      })
      const MAX = 1024
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
      imageData = canvas.toDataURL("image/jpeg", 0.82).split(",")[1]
    } catch { /* proceed without image */ }

    const res = await fetch("/api/aura", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageData, colors: detectedColors, language }),
    })
    const data = await res.json()
    if (!res.ok) { setLoading(false); voice.setAvatarState("idle"); return }

    setReading(data.reading)
    setIsComplete(true)
    setLoading(false)
    voice.setAvatarState("speaking")
    await speakStreaming(data.reading, simliSendRef.current)
    voice.setAvatarState("idle")
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(42,26,85,0.5)" }}>
        <Link href="/dashboard" style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7a8ba8", textDecoration: "none" }}>← RETURN</Link>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#818cf8" }}>🌈 AURA READING</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ flex: 1, maxWidth: 680, width: "100%", margin: "0 auto", padding: "28px 16px", display: "flex", flexDirection: "column", gap: 24 }}>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GalileoPanel
            avatarState={hasStarted ? voice.avatarState : "closed"}
            hasStarted={hasStarted}
            mode={voice.mode}
            setMode={voice.setMode}
            isListening={voice.isListening}
            interimTranscript={voice.interimTranscript}
            voiceSupported={voice.voiceSupported}
            onSendAudio={(fn) => { simliSendRef.current = fn }}
          />
        </div>

        {/* Upload area — only before reading starts */}
        {!hasStarted && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: "#8878a8", fontStyle: "italic", textAlign: "center", maxWidth: 460, lineHeight: 1.7 }}>
              Upload a photo. Galileo will read the energy field around you — the colors, the light, what is present and what is asking to be seen.
            </p>

            {/* Photo + aura glow preview */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: "pointer", position: "relative", width: 220, height: 220 }}
            >
              {imagePreview ? (
                <div style={{ width: 220, height: 220, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(129,140,248,0.4)", boxShadow: auraGlow || "0 0 30px rgba(129,140,248,0.2)", transition: "box-shadow 0.8s ease", position: "relative" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={imagePreview}
                    alt="Your photo"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  {/* Subtle inner gradient to blend photo into aura */}
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at center, transparent 55%, rgba(4,2,14,0.35) 100%)" }} />
                </div>
              ) : (
                <div style={{ width: 220, height: 220, borderRadius: "50%", border: "2px dashed rgba(129,140,248,0.3)", background: "rgba(10,5,32,0.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <div style={{ fontSize: 32, opacity: 0.3 }}>🌈</div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#4a3870" }}>TAP TO UPLOAD</div>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="user" onChange={handleFileChange} style={{ display: "none" }} />

            {/* Detected color swatches */}
            {detectedColors.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%", maxWidth: 440 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.3em", color: "#4a3870" }}>YOUR FIELD CONTAINS</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {detectedColors.map(c => (
                    <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, border: `1px solid ${c.hex}60`, background: `${c.hex}18` }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.hex, boxShadow: `0 0 8px ${c.hex}` }} />
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.12em", color: c.hex }}>{c.name}</span>
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: "#4a3870" }}>{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {imageError && <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#be123c" }}>{imageError}</div>}

            <button
              onClick={startReading}
              disabled={!imageFile || loading || detectedColors.length === 0}
              style={{ padding: "14px 48px", borderRadius: 8, border: "1px solid rgba(129,140,248,0.5)", background: imageFile && detectedColors.length > 0 ? "linear-gradient(135deg, rgba(79,70,229,0.18), rgba(124,58,237,0.18))" : "rgba(42,26,85,0.3)", color: imageFile && detectedColors.length > 0 ? "#818cf8" : "#4a3870", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", cursor: imageFile && detectedColors.length > 0 ? "pointer" : "not-allowed" }}
            >
              {detectedColors.length === 0 && imageFile ? "READING YOUR FIELD…" : "READ MY AURA ✦"}
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#818cf8", animation: "moonPulse 1.2s ease-in-out infinite", animationDelay: `${i*0.3}s` }} />)}
            </div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#4a3870", fontStyle: "italic" }}>Galileo is reading your field…</p>
          </div>
        )}

        {/* Results */}
        {reading && isComplete && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeUp 0.6s ease-out forwards" }}>

            {/* Photo with aura glow */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ width: 220, height: 220, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(129,140,248,0.5)", boxShadow: auraGlow, transition: "box-shadow 1s ease", position: "relative" }}>
                {imagePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="Your aura" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at center, transparent 50%, rgba(4,2,14,0.3) 100%)" }} />
              </div>

              {/* Color swatches */}
              {detectedColors.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {detectedColors.map(c => (
                    <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, border: `1px solid ${c.hex}60`, background: `${c.hex}18` }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.hex, boxShadow: `0 0 10px ${c.hex}` }} />
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.12em", color: c.hex }}>{c.name}</span>
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: "#4a3870" }}>{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reading */}
            <div style={{ padding: "28px 32px", borderRadius: 12, border: "1px solid rgba(129,140,248,0.15)", background: "linear-gradient(135deg, rgba(26,13,63,0.92), rgba(10,5,32,0.95))", backdropFilter: "blur(8px)" }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.25em", color: "#7a8ba8", marginBottom: 20 }}>🌈 YOUR AURA READING</div>
              {reading.split("\n\n").map((para, i) => (
                <p key={i} style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, lineHeight: 1.9, color: "#ddd8f0", marginBottom: i < reading.split("\n\n").length - 1 ? 20 : 0 }}>
                  {para}
                </p>
              ))}
            </div>

            <div style={{ textAlign: "center" }}>
              <Link href="/dashboard" style={{ padding: "10px 28px", borderRadius: 8, border: "1px solid rgba(129,140,248,0.3)", background: "rgba(129,140,248,0.06)", color: "#818cf8", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", textDecoration: "none" }}>
                RETURN ✦
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
