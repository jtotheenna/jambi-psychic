"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import GalileoPanel from "@/components/GalileoPanel"
import { useGalileoVoice } from "@/lib/useGalileoVoice"


import GemProgress from "@/components/GemProgress"
import CartomancyCard from "@/components/CartomancyCard"
import { playBoxOpen, playCardReveal, playSessionEnd } from "@/lib/sounds"
import { speakStreaming } from "@/lib/speak"

type CardDrawn = { name: string; suit: string; rank: string; position?: string }
type Message = { role: "user" | "galileo"; content: string; cards?: CardDrawn[] }

const SUIT_SYMBOL: Record<string, string> = {
  Hearts: "♥", Diamonds: "♦", Clubs: "♣", Spades: "♠"
}
const RANK_ABBR: Record<string, string> = {
  Ace: "A", Two: "2", Three: "3", Four: "4", Five: "5",
  Six: "6", Seven: "7", Eight: "8", Nine: "9", Ten: "10",
  Jack: "J", Queen: "Q", King: "K",
}

export default function CartomancyPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [exchangesUsed, setExchangesUsed] = useState(0)
  const [exchangesTotal, setExchangesTotal] = useState(5)
  const [isComplete, setIsComplete] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [allCards, setAllCards] = useState<CardDrawn[]>([])
  const scrollRef    = useRef<HTMLDivElement>(null)
  const simliSendRef = useRef<((pcm: Uint8Array) => void) | null>(null)
  const voice = useGalileoVoice()
  const language = "en"
  useEffect(() => { voice.open() }, []) // eslint-disable-line

  const speakWithSimli = useCallback(async (text: string) => {
    voice.setAvatarState("speaking")
    await speakStreaming(text, simliSendRef.current)
    voice.setAvatarState("idle")
  }, [voice])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  async function openReading() {
    const silentAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    silentAudio.volume = 0
    silentAudio.play().catch(() => {})

    setHasStarted(true)
    playBoxOpen()
    setLoading(true)
    voice.setAvatarState("thinking")

    const res = await fetch("/api/cartomancy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "__OPENING__", sessionId, language }),
    })
    const data = await res.json()
    if (!res.ok) { setLoading(false); voice.setLoading(false); return }

    if (!sessionId && data.sessionId) setSessionId(data.sessionId)
    setMessages([{ role: "galileo", content: data.response }])
    voice.setAvatarState("idle")
    setLoading(false)
    await speakWithSimli(data.response)
  }

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading || isComplete) return
    // Unlock audio within user gesture before async API call
    const sa = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    sa.volume = 0; sa.play().catch(() => {})
    setInput("")
    setLoading(true)
    voice.setAvatarState("thinking")
    setMessages(prev => [...prev, { role: "user", content: msg }])

    const res = await fetch("/api/cartomancy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, sessionId, voiceMode: voice.mode === "conversational", language }),
    })
    const data = await res.json()
    if (!res.ok) { setLoading(false); voice.setLoading(false); return }

    if (!sessionId && data.sessionId) setSessionId(data.sessionId)
    if (data.exchangesTotal) setExchangesTotal(data.exchangesTotal)
    if (data.cards?.length > 0) {
      setAllCards(prev => [...prev, ...data.cards])
      // Chime for each card dealt
      data.cards.forEach((_: unknown, i: number) => setTimeout(() => playCardReveal(i), i * 250))
    }
    setExchangesUsed(data.exchangesUsed)
    setIsComplete(data.isComplete)
    if (data.isComplete) playSessionEnd()
    setMessages(prev => [...prev, { role: "galileo", content: data.response, cards: data.cards }])
    voice.setAvatarState("idle")
    setLoading(false)
    if (voice.mode !== "text") {
      await speakWithSimli(data.response)
      if (voice.mode === "conversational" && !data.isComplete) {
        voice.startListening(t => sendMessage(t))
      }
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(42,26,85,0.5)" }}>
        <Link href="/dashboard" style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7a8ba8", textDecoration: "none" }}>← RETURN</Link>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#e879a0" }}>♠ CARTOMANCY</div>
        <GemProgress total={exchangesTotal} used={exchangesUsed} />
      </div>

      <div style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Galileo — normal flow, not sticky */}
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

        {/* Cards — shown after question, inline horizontal scroll */}
        {allCards.length > 0 && (
          <div style={{ padding: "16px", borderRadius: 10, border: "1px solid rgba(232,121,160,0.25)", background: "rgba(10,5,32,0.6)" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.25em", color: "#7a8ba8", marginBottom: 16, textAlign: "center" }}>
              ♠ THE CARDS · tap any card to read it
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
              {allCards.map((card, i) => (
                <CartomancyCard
                  key={i}
                  name={card.name}
                  suit={card.suit}
                  rank={card.rank}
                  position={card.position}
                  revealDelay={i * 200}
                />
              ))}
            </div>
          </div>
        )}

        {!hasStarted ? (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: "#7a8ba8", fontStyle: "italic", marginBottom: 24 }}>
              The cards are shuffled. He is waiting.
            </p>
            <button onClick={openReading} style={{ padding: "16px 48px", borderRadius: 8, border: "1px solid rgba(232,121,160,0.5)", background: "linear-gradient(135deg, rgba(232,121,160,0.12) 0%, rgba(79,70,229,0.12) 100%)", color: "#e879a0", fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: "0.2em", cursor: "pointer" }}>
              OPEN THE CARDS ♠
            </button>
          </div>
        ) : (
          <div ref={scrollRef} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, maxHeight: "45vh", overflowY: "auto" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: msg.role === "galileo" ? "radial-gradient(circle, #1a0d3f, #0a0520)" : "rgba(42,26,85,0.6)", border: msg.role === "galileo" ? "1px solid rgba(232,121,160,0.4)" : "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                  {msg.role === "galileo" ? "♠" : "✦"}
                </div>
                <div style={{ maxWidth: "78%", padding: "14px 18px", borderRadius: msg.role === "galileo" ? "4px 16px 16px 16px" : "16px 4px 16px 16px", background: msg.role === "galileo" ? "linear-gradient(135deg, rgba(26,13,63,0.9), rgba(10,5,32,0.9))" : "rgba(42,26,85,0.5)", border: msg.role === "galileo" ? "1px solid rgba(232,121,160,0.15)" : "1px solid rgba(201,168,76,0.2)", fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.8, color: "#ddd8f0", backdropFilter: "blur(8px)" }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "radial-gradient(circle, #1a0d3f, #0a0520)", border: "1px solid rgba(232,121,160,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>♠</div>
                <div style={{ padding: "14px 18px", borderRadius: "4px 16px 16px 16px", background: "rgba(26,13,63,0.9)", border: "1px solid rgba(232,121,160,0.15)", display: "flex", gap: 6, alignItems: "center" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#e879a0", animation: "moonPulse 1.2s ease-in-out infinite", animationDelay: `${i*0.3}s` }} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {hasStarted && !isComplete && messages.length > 0 && (
          <div style={{ padding: 16, background: "rgba(10,5,32,0.6)", borderRadius: 12, border: "1px solid rgba(42,26,85,0.6)", backdropFilter: "blur(8px)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }} disabled={loading} placeholder="Ask anything..." rows={2} style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", color: "#ddd8f0", fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.6 }} />
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ padding: "10px 20px", borderRadius: 8, height: 40, border: "1px solid rgba(232,121,160,0.4)", background: loading || !input.trim() ? "rgba(42,26,85,0.3)" : "rgba(232,121,160,0.1)", color: loading || !input.trim() ? "#4a3870" : "#e879a0", fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.15em", cursor: loading || !input.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                {loading ? "♠" : "SEND ✦"}
              </button>
            </div>
          </div>
        )}

        {isComplete && (
          <div style={{ textAlign: "center", padding: 24, borderRadius: 12, border: "1px solid rgba(232,121,160,0.2)", background: "rgba(10,5,32,0.6)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>♠</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", color: "#e879a0", marginBottom: 16 }}>THE READING IS COMPLETE</div>
            <Link href="/dashboard" style={{ padding: "10px 28px", borderRadius: 8, border: "1px solid rgba(232,121,160,0.3)", background: "rgba(232,121,160,0.08)", color: "#e879a0", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", textDecoration: "none" }}>
              RETURN ✦
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
