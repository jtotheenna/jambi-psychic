"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useGalileoVoice } from "@/lib/useGalileoVoice"
import { speakStreaming } from "@/lib/speak"
import { playBoxOpen, playSessionEnd } from "@/lib/sounds"
import { readSSE, nextBoundary, rafThrottle } from "@/lib/readSSE"
import GalileoPanel from "@/components/GalileoPanel"

const SpeechRecognition = typeof window !== "undefined"
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null

type Message = { role: "user" | "galileo"; content: string }

export default function DreamPage() {
  const [dream, setDream] = useState("")
  const [followInput, setFollowInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [exchangesUsed, setExchangesUsed] = useState(0)
  const [exchangesTotal] = useState(3)
  const [loading, setLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [micSupported, setMicSupported] = useState(false)
  const recognitionRef = useRef<InstanceType<NonNullable<typeof SpeechRecognition>> | null>(null)
  const simliSendRef = useRef<((pcm: Uint8Array) => void) | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const voice = useGalileoVoice()
  const language = "en"

  useEffect(() => { voice.open(); setMicSupported(!!SpeechRecognition) }, []) // eslint-disable-line
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length])

  function startListening() {
    if (!SpeechRecognition || isListening) return
    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(" ")
      // After initial dream submitted, append to follow-up input; otherwise to dream
      if (hasStarted) setFollowInput(prev => prev ? `${prev} ${t}` : t)
      else setDream(prev => prev ? `${prev} ${t}` : t)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
  }
  function stopListening() { recognitionRef.current?.stop() }

  async function submitDream() {
    if (!dream.trim() || loading) return
    const sa = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    sa.volume = 0; sa.play().catch(() => {})
    playBoxOpen()
    setHasStarted(true)
    setLoading(true)
    voice.setAvatarState("thinking")

    const res = await fetch("/api/dream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dream, language }),
    })
    if (!res.ok || !res.body) { setLoading(false); voice.setAvatarState("idle"); return }

    let pending = "", fullText = ""
    setMessages([{ role: "user", content: dream }, { role: "galileo", content: "" }])
    setLoading(false)
    const chain = { current: Promise.resolve() as Promise<void> }
    const queueSentence = (text: string) => {
      if (voice.mode === "text" || !text.trim()) return
      voice.setAvatarState("speaking")
      chain.current = chain.current.then(() => speakStreaming(text, simliSendRef.current))
    }

    const setTextThrottled1 = rafThrottle((t: string) => setMessages(prev => [...prev.slice(0, -1), { role: "galileo", content: t }]))
    await readSSE(res.body, (data) => {
      if (data.type === "delta") {
        fullText += data.text as string
        pending += data.text as string
        setTextThrottled1(fullText)
        const b = nextBoundary(pending); if (b !== -1) { queueSentence(pending.slice(0, b)); pending = pending.slice(b) }
      } else if (data.type === "done") {
        queueSentence(pending.trim()); pending = ""
        if (data.sessionId) setSessionId(data.sessionId as string)
        setExchangesUsed((data.exchangesUsed as number) ?? 1)
      }
    })
    await chain.current
    voice.setAvatarState("idle")
  }

  async function sendFollowUp() {
    const msg = followInput.trim()
    if (!msg || !sessionId || loading || isComplete) return
    const sa = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    sa.volume = 0; sa.play().catch(() => {})
    setFollowInput("")
    setLoading(true)
    voice.setAvatarState("thinking")
    setMessages(prev => [...prev, { role: "user", content: msg }, { role: "galileo", content: "" }])

    const res = await fetch("/api/dream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, sessionId, language }),
    })
    if (!res.ok || !res.body) { setLoading(false); voice.setAvatarState("idle"); return }

    let pending = "", fullText = "", doneData: Record<string, unknown> = {}
    setLoading(false)
    const chain = { current: Promise.resolve() as Promise<void> }
    const queueSentence = (text: string) => {
      if (voice.mode === "text" || !text.trim()) return
      voice.setAvatarState("speaking")
      chain.current = chain.current.then(() => speakStreaming(text, simliSendRef.current))
    }

    const setTextThrottled2 = rafThrottle((t: string) => setMessages(prev => [...prev.slice(0, -1), { role: "galileo", content: t }]))
    await readSSE(res.body, (data) => {
      if (data.type === "delta") {
        fullText += data.text as string; pending += data.text as string
        setTextThrottled2(fullText)
        const b = nextBoundary(pending); if (b !== -1) { queueSentence(pending.slice(0, b)); pending = pending.slice(b) }
      } else if (data.type === "done") {
        doneData = data; queueSentence(pending.trim()); pending = ""
        setExchangesUsed(data.exchangesUsed as number)
      }
    })
    await chain.current
    voice.setAvatarState("idle")
    if (doneData.isComplete) { playSessionEnd(); setIsComplete(true) }
  }

  const followUpsLeft = exchangesTotal - exchangesUsed

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(42,26,85,0.5)" }}>
        <Link href="/dashboard" style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7a8ba8", textDecoration: "none" }}>← RETURN</Link>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#a5b4fc" }}>☁ DREAM INTERPRETATION</div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.1em", color: "#4a3870" }}>
          {hasStarted ? `${followUpsLeft} FOLLOW-UP${followUpsLeft !== 1 ? "S" : ""} LEFT` : ""}
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 680, width: "100%", margin: "0 auto", padding: "32px 16px", display: "flex", flexDirection: "column", gap: 24 }}>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GalileoPanel
            avatarState={voice.avatarState}
            hasStarted={hasStarted}
            mode={voice.mode}
            setMode={voice.setMode}
            isListening={voice.isListening}
            interimTranscript={voice.interimTranscript}
            voiceSupported={voice.voiceSupported}
            onSendAudio={(fn) => { simliSendRef.current = fn }}
          />
        </div>

        {/* Dream input — before submission */}
        {!hasStarted && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: "#8878a8", fontStyle: "italic", textAlign: "center", lineHeight: 1.75, maxWidth: 520, margin: "0 auto" }}>
              Describe the dream as fully as you can — the people, the places, the feeling, what stayed with you when you woke.
            </p>

            {isListening && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8, background: "rgba(165,180,252,0.1)", border: "1px solid rgba(165,180,252,0.3)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a5b4fc", animation: "moonPulse 0.8s ease-in-out infinite" }} />
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em", color: "#a5b4fc" }}>LISTENING…</span>
                <button onClick={stopListening} style={{ marginLeft: "auto", fontFamily: "'Cinzel', serif", fontSize: 8, color: "#7a8ba8", background: "none", border: "none", cursor: "pointer" }}>STOP</button>
              </div>
            )}

            <div style={{ position: "relative" }}>
              <textarea
                value={dream}
                onChange={e => setDream(e.target.value)}
                placeholder={isListening ? "Listening…" : "I was in a house I didn't recognize, and there was water coming in from somewhere I couldn't find…"}
                rows={8}
                style={{ width: "100%", background: "rgba(10,5,32,0.7)", border: `1px solid ${isListening ? "rgba(165,180,252,0.4)" : "rgba(165,180,252,0.2)"}`, borderRadius: 10, padding: "18px 20px", paddingRight: micSupported ? "56px" : "20px", color: "#ddd8f0", fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.7, resize: "vertical", outline: "none" }}
              />
              {micSupported && (
                <button
                  onMouseDown={startListening} onMouseUp={stopListening}
                  onTouchStart={startListening} onTouchEnd={stopListening}
                  title="Hold to speak your dream"
                  style={{ position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: "50%", border: `1px solid ${isListening ? "rgba(165,180,252,0.8)" : "rgba(42,26,85,0.8)"}`, background: isListening ? "rgba(79,70,229,0.3)" : "rgba(26,13,63,0.7)", color: isListening ? "#a5b4fc" : "#4a3870", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease" }}
                >🎙</button>
              )}
            </div>

            {micSupported && <p style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.12em", color: "#2a1a55", textAlign: "center" }}>HOLD MIC TO SPEAK YOUR DREAM · OR TYPE</p>}

            <button onClick={submitDream} disabled={!dream.trim() || loading} style={{ padding: "14px", borderRadius: 8, border: "1px solid rgba(165,180,252,0.35)", background: dream.trim() ? "linear-gradient(135deg, rgba(79,70,229,0.18), rgba(124,58,237,0.18))" : "rgba(42,26,85,0.3)", color: dream.trim() ? "#a5b4fc" : "#4a3870", fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.2em", cursor: dream.trim() ? "pointer" : "not-allowed" }}>
              READ THIS DREAM ✦
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#a5b4fc", animation: "moonPulse 1.2s ease-in-out infinite", animationDelay: `${i*0.3}s` }} />)}
            </div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#4a3870", fontStyle: "italic" }}>
              {messages.length === 0 ? "Galileo is reading the symbols…" : "Going deeper…"}
            </p>
          </div>
        )}

        {/* Conversation — reading + follow-ups */}
        {messages.length > 0 && (
          <div ref={scrollRef} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: msg.role === "galileo" ? "radial-gradient(circle, #1a0d3f, #0a0520)" : "rgba(42,26,85,0.6)", border: `1px solid ${msg.role === "galileo" ? "rgba(165,180,252,0.4)" : "rgba(165,180,252,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: msg.role === "galileo" ? 12 : 10 }}>
                  {msg.role === "galileo" ? "☁" : "✦"}
                </div>
                <div style={{ maxWidth: "88%", padding: msg.role === "galileo" ? "24px 28px" : "12px 16px", borderRadius: msg.role === "galileo" ? "4px 16px 16px 16px" : "16px 4px 16px 16px", background: msg.role === "galileo" ? "linear-gradient(135deg, rgba(26,13,63,0.92), rgba(10,5,32,0.95))" : "rgba(42,26,85,0.5)", border: `1px solid ${msg.role === "galileo" ? "rgba(165,180,252,0.15)" : "rgba(165,180,252,0.1)"}`, backdropFilter: msg.role === "galileo" ? "blur(8px)" : undefined }}>
                  {msg.role === "galileo" && i === 1 && (
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.25em", color: "#7a8ba8", marginBottom: 16 }}>☁ YOUR DREAM READING</div>
                  )}
                  {msg.content.split("\n\n").filter(p => p.trim()).map((para, pi) => (
                    <p key={pi} style={{ fontFamily: "'EB Garamond', serif", fontSize: msg.role === "galileo" ? 18 : 16, lineHeight: 1.9, color: msg.role === "galileo" ? "#ddd8f0" : "#b8b0d8", marginBottom: pi < msg.content.split("\n\n").filter(p => p.trim()).length - 1 ? (msg.role === "galileo" ? 18 : 8) : 0, fontStyle: msg.role === "user" ? "italic" : "normal" }}>
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Follow-up input */}
        {hasStarted && !loading && !isComplete && messages.length > 0 && (
          <div style={{ padding: "16px", background: "rgba(10,5,32,0.6)", borderRadius: 12, border: "1px solid rgba(165,180,252,0.2)", backdropFilter: "blur(8px)" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.15em", color: "#4a3870", marginBottom: 10 }}>
              ☁ ASK GALILEO TO GO DEEPER — {followUpsLeft} EXCHANGE{followUpsLeft !== 1 ? "S" : ""} REMAINING
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <textarea
                  value={followInput}
                  onChange={e => setFollowInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendFollowUp() } }}
                  placeholder="What does the water mean? What about the figure who appeared?…"
                  rows={2}
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", color: "#ddd8f0", fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.6, paddingRight: micSupported ? "44px" : "0" }}
                />
                {micSupported && (
                  <button
                    onMouseDown={startListening} onMouseUp={stopListening}
                    onTouchStart={startListening} onTouchEnd={stopListening}
                    style={{ position: "absolute", top: 4, right: 0, width: 32, height: 32, borderRadius: "50%", border: `1px solid ${isListening ? "rgba(165,180,252,0.7)" : "rgba(42,26,85,0.7)"}`, background: isListening ? "rgba(79,70,229,0.3)" : "rgba(26,13,63,0.6)", color: isListening ? "#a5b4fc" : "#4a3870", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >🎙</button>
                )}
              </div>
              <button onClick={sendFollowUp} disabled={!followInput.trim()} style={{ padding: "10px 18px", borderRadius: 8, height: 40, border: "1px solid rgba(165,180,252,0.4)", background: followInput.trim() ? "rgba(165,180,252,0.1)" : "rgba(42,26,85,0.3)", color: followInput.trim() ? "#a5b4fc" : "#4a3870", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.12em", cursor: followInput.trim() ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}>
                ASK ✦
              </button>
            </div>
          </div>
        )}

        {/* Complete */}
        {isComplete && (
          <div style={{ textAlign: "center", padding: "24px", borderRadius: 12, border: "1px solid rgba(165,180,252,0.2)", background: "rgba(10,5,32,0.6)" }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>☁</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.2em", color: "#a5b4fc", marginBottom: 16 }}>THE READING IS COMPLETE</div>
            <Link href="/dashboard" style={{ padding: "10px 28px", borderRadius: 8, border: "1px solid rgba(165,180,252,0.3)", background: "rgba(165,180,252,0.06)", color: "#a5b4fc", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", textDecoration: "none" }}>
              RETURN ✦
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
