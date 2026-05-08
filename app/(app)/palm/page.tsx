"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import GalileoPanel from "@/components/GalileoPanel"
import { useGalileoVoice } from "@/lib/useGalileoVoice"
import { getStoredLanguage } from "@/lib/language"
import LanguageSelector from "@/components/LanguageSelector"

type Message = { role: "user" | "galileo"; content: string }

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
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [exchangesUsed, setExchangesUsed] = useState(0)
  const [exchangesTotal] = useState(5)
  const [isComplete, setIsComplete] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const voice = useGalileoVoice()
  const language = typeof window !== "undefined" ? getStoredLanguage() : "en"

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

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

    // Unlock HTML5 audio for Safari
    const silentAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    silentAudio.volume = 0
    silentAudio.play().catch(() => {})

    setHasEntered(true)
    voice.open()
    setLoading(true)
    voice.setLoading(true)

    let imageData: string | null = null
    try { imageData = await compressImage(imageFile) } catch { /* send without image */ }

    const res = await fetch("/api/palm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "__OPENING__", imageData, voiceMode: voice.mode === "conversational", language }),
    })
    const data = await res.json()
    if (!res.ok) { setLoading(false); voice.setLoading(false); return }

    if (!sessionId) setSessionId(data.sessionId)
    setMessages([{ role: "galileo", content: data.reading }])
    voice.setLoading(false)
    setLoading(false)
    await voice.speak(data.reading)
    if (voice.mode === "conversational") {
      voice.startListening((t) => sendMessage(t))
    }
  }

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading || isComplete) return
    setInput("")
    setLoading(true)
    voice.setLoading(true)
    setMessages((prev) => [...prev, { role: "user", content: msg }])

    const res = await fetch("/api/palm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, sessionId, voiceMode: voice.mode === "conversational", language }),
    })
    const data = await res.json()
    if (!res.ok) { setLoading(false); voice.setLoading(false); return }

    if (!sessionId) setSessionId(data.sessionId)
    setExchangesUsed(data.exchangesUsed)
    setIsComplete(data.isComplete)
    setMessages((prev) => [...prev, { role: "galileo", content: data.reading }])
    voice.setLoading(false)
    setLoading(false)
    if (voice.mode !== "text") {
      await voice.speak(data.reading)
      if (voice.mode === "conversational" && !data.isComplete) {
        voice.startListening((t) => sendMessage(t))
      }
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(42,26,85,0.5)" }}>
        <Link href="/dashboard" style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7a8ba8", textDecoration: "none" }}>← RETURN</Link>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#4a3870" }}>✋ PALM READING</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LanguageSelector compact />
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.1em", color: "#4a3870" }}>{exchangesTotal - exchangesUsed} LEFT</div>
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GalileoPanel
            avatarState={hasEntered ? voice.avatarState : "closed"}
            hasStarted={hasEntered}
            mode={voice.mode}
            setMode={voice.setMode}
            isListening={voice.isListening}
            interimTranscript={voice.interimTranscript}
            voiceSupported={voice.voiceSupported}
          />
        </div>

        {/* Upload + enter screen */}
        {!hasEntered && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "8px 0" }}>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: "#c8d4e8", fontStyle: "italic", textAlign: "center", maxWidth: 460 }}>
              Hold your dominant hand open, palm facing up, in natural light. Take a photo and let Galileo read what is written there.
            </p>

            {/* Upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ width: "100%", maxWidth: 400, minHeight: 180, borderRadius: 12, border: `2px dashed ${imagePreview ? "rgba(201,168,76,0.5)" : "rgba(42,26,85,0.7)"}`, background: imagePreview ? "rgba(10,5,32,0.8)" : "rgba(10,5,32,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", position: "relative", transition: "border-color 0.3s" }}
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
            {imageError && <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "#be123c", letterSpacing: "0.1em" }}>{imageError}</div>}

            <button
              onClick={startReading}
              disabled={!imageFile || loading}
              style={{ padding: "14px 48px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.5)", background: imageFile ? "linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(79,70,229,0.15) 100%)" : "rgba(42,26,85,0.3)", color: imageFile ? "#c9a84c" : "#4a3870", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", cursor: imageFile ? "pointer" : "not-allowed" }}
            >
              {loading ? "GALILEO IS READING..." : "READ MY HAND ✦"}
            </button>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, maxHeight: "50vh", overflowY: "auto" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: msg.role === "galileo" ? "radial-gradient(circle, #1a0d3f, #0a0520)" : "rgba(42,26,85,0.6)", border: msg.role === "galileo" ? "1px solid rgba(165,180,252,0.4)" : "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                {msg.role === "galileo" ? "☽" : "✦"}
              </div>
              <div style={{ maxWidth: "78%", padding: "14px 18px", borderRadius: msg.role === "galileo" ? "4px 16px 16px 16px" : "16px 4px 16px 16px", background: msg.role === "galileo" ? "linear-gradient(135deg, rgba(26,13,63,0.9), rgba(10,5,32,0.9))" : "rgba(42,26,85,0.5)", border: msg.role === "galileo" ? "1px solid rgba(165,180,252,0.2)" : "1px solid rgba(201,168,76,0.2)", fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.8, color: "#ddd8f0", backdropFilter: "blur(8px)" }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && hasEntered && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "radial-gradient(circle, #1a0d3f, #0a0520)", border: "1px solid rgba(165,180,252,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>☽</div>
              <div style={{ padding: "14px 18px", borderRadius: "4px 16px 16px 16px", background: "rgba(26,13,63,0.9)", border: "1px solid rgba(165,180,252,0.2)", display: "flex", gap: 6, alignItems: "center" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#a5b4fc", animation: "moonPulse 1.2s ease-in-out infinite", animationDelay: `${i*0.3}s` }} />)}
              </div>
            </div>
          )}
        </div>

        {hasEntered && !isComplete && messages.length > 0 && (
          <div style={{ padding: 16, background: "rgba(10,5,32,0.6)", borderRadius: 12, border: "1px solid rgba(42,26,85,0.6)", backdropFilter: "blur(8px)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                disabled={loading}
                placeholder="Ask anything about what he sees..."
                rows={2}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", color: "#ddd8f0", fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.6 }}
              />
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ padding: "10px 20px", borderRadius: 8, height: 40, border: "1px solid rgba(201,168,76,0.4)", background: loading || !input.trim() ? "rgba(42,26,85,0.3)" : "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(79,70,229,0.15))", color: loading || !input.trim() ? "#4a3870" : "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.15em", cursor: loading || !input.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                {loading ? "☽" : "SEND ✦"}
              </button>
            </div>
          </div>
        )}

        {isComplete && (
          <div style={{ textAlign: "center", padding: 24, borderRadius: 12, border: "1px solid rgba(201,168,76,0.2)", background: "rgba(10,5,32,0.6)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✋</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", color: "#c9a84c", marginBottom: 16 }}>THE READING IS COMPLETE</div>
            <Link href="/dashboard" style={{ padding: "10px 28px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.08)", color: "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", textDecoration: "none" }}>
              RETURN ✦
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
