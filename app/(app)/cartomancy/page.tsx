"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import GalileoCircle from "@/components/GalileoCircle"
import { useGalileoVoice } from "@/lib/useGalileoVoice"
import GemProgress from "@/components/GemProgress"
import { CARTOMANCY_DECK } from "@/lib/cartomancy"
import { playBoxOpen, playCardReveal, playSessionEnd } from "@/lib/sounds"
import { speakStreaming } from "@/lib/speak"
import { readSSE, nextBoundary, rafThrottle } from "@/lib/readSSE"

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
const SUIT_DESC: Record<string, string> = {
  Hearts: "Love, emotion, relationships, the inner life",
  Diamonds: "Money, work, material world, practical outcomes",
  Clubs: "Ambition, career, energy, action",
  Spades: "Truth, conflict, difficulty, transformation",
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
  const [expandedCard, setExpandedCard] = useState<CardDrawn | null>(null)

  const voice = useGalileoVoice()
  const language = "en"
  useEffect(() => { voice.open() }, []) // eslint-disable-line

  const speakWithSimli = useCallback(async (text: string) => {
    voice.setAvatarState("speaking")
    await speakStreaming(text)
    voice.setAvatarState("idle")
  }, [voice])

  const audioChainRef = useRef<Promise<void>>(Promise.resolve())

  function makeChain() {
    audioChainRef.current = Promise.resolve()
    const queueSentence = (text: string) => {
      if (voice.mode === "text" || !text.trim()) return
      voice.setAvatarState("speaking")
      audioChainRef.current = audioChainRef.current.then(() => speakStreaming(text))
    }
    return queueSentence
  }

  async function openReading() {
    const silentAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    silentAudio.volume = 0; silentAudio.play().catch(() => {})
    setHasStarted(true)
    playBoxOpen()
    setLoading(true)
    voice.setAvatarState("thinking")

    const res = await fetch("/api/cartomancy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "__OPENING__", sessionId, language }),
    })
    if (!res.ok || !res.body) { setLoading(false); voice.setAvatarState("idle"); return }

    const queueSentence = makeChain()
    let pending = "", fullText = ""
    setMessages([{ role: "galileo", content: "" }])
    setLoading(false)

    await readSSE(res.body, (data) => {
      if (data.type === "delta") {
        fullText += data.text as string; pending += data.text as string
        setMessages([{ role: "galileo", content: fullText }])
        const b = nextBoundary(pending); if (b !== -1) { queueSentence(pending.slice(0, b)); pending = pending.slice(b) }
      } else if (data.type === "done") {
        queueSentence(pending.trim()); pending = ""
        if (data.sessionId && !sessionId) setSessionId(data.sessionId as string)
      }
    })
    await audioChainRef.current
    voice.setAvatarState("idle")
  }

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading || isComplete) return
    const sa = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    sa.volume = 0; sa.play().catch(() => {})
    setInput("")
    setLoading(true)
    voice.setAvatarState("thinking")
    setMessages(prev => [...prev, { role: "user", content: msg }, { role: "galileo", content: "" }])

    const res = await fetch("/api/cartomancy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, sessionId, voiceMode: voice.mode === "conversational", language }),
    })
    if (!res.ok || !res.body) { setLoading(false); voice.setAvatarState("idle"); return }

    const queueSentence = makeChain()
    let pending = "", fullText = "", doneData: Record<string, unknown> = {}
    setLoading(false)
    const setTextThrottled = rafThrottle((t: string) => setMessages(prev => [...prev.slice(0, -1), { role: "galileo", content: t }]))

    await readSSE(res.body, (data) => {
      if (data.type === "cards") {
        const cards = data.cards as CardDrawn[]
        setAllCards(prev => [...prev, ...cards])
        cards.forEach((_: unknown, i: number) => setTimeout(() => playCardReveal(i), i * 320))
      } else if (data.type === "delta") {
        fullText += data.text as string; pending += data.text as string
        setTextThrottled(fullText)
        const b = nextBoundary(pending); if (b !== -1) { queueSentence(pending.slice(0, b)); pending = pending.slice(b) }
      } else if (data.type === "done") {
        doneData = data; queueSentence(pending.trim()); pending = ""
        if (!sessionId && data.sessionId) setSessionId(data.sessionId as string)
        if (data.exchangesTotal) setExchangesTotal(data.exchangesTotal as number)
        setExchangesUsed(data.exchangesUsed as number)
      }
    })
    await audioChainRef.current
    voice.setAvatarState("idle")
    if (doneData.isComplete) { playSessionEnd(); setIsComplete(true) }
    if (voice.mode === "conversational" && !doneData.isComplete) {
      voice.startListening(t => sendMessage(t))
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>

      {/* Nav bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(42,26,85,0.5)",
        background: "rgba(4,2,14,0.9)", backdropFilter: "blur(12px)",
      }}>
        <Link href="/dashboard" style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#7a8ba8", textDecoration: "none" }}>← RETURN</Link>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#e879a0" }}>♠ CARTOMANCY</div>
        <GemProgress total={exchangesTotal} used={exchangesUsed} />
      </div>

      {/* Reading bar — Galileo left, mini card strip right */}
      <div style={{
        position: "sticky", top: 57, zIndex: 30,
        display: "flex", justifyContent: "center",
        padding: "10px 14px",
        background: "rgba(4,2,14,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(42,26,85,0.4)", minHeight: 152,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, maxWidth: 720, width: "100%" }}>
          <div style={{ flexShrink: 0 }}>
            <GalileoCircle
              state={voice.avatarState}
              size={124}
              showName={false}
              showStars={false}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {allCards.length > 0 ? (
              <>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: "0.2em", color: "#4a3870" }}>
                  ♠ THE CARDS · TAP TO READ
                </div>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                  {allCards.map((card, i) => {
                    const isRed = card.suit === "Hearts" || card.suit === "Diamonds"
                    const sym = SUIT_SYMBOL[card.suit]
                    const abbr = RANK_ABBR[card.rank] || card.rank
                    const col = isRed ? "#c41e3a" : "#1a1a2e"
                    return (
                      <div
                        key={i}
                        onClick={() => setExpandedCard(card)}
                        style={{ flexShrink: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, animation: `fadeUp 0.5s ease-out ${i * 320}ms both` }}
                      >
                        <div
                          style={{ width: 56, height: 80, borderRadius: 5, background: "#fff", border: "1px solid #ccc", boxShadow: "0 2px 8px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "4px 5px", transition: "box-shadow 0.15s ease, transform 0.15s ease" }}
                          onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.boxShadow = "0 4px 16px rgba(232,121,160,0.45)"; d.style.transform = "translateY(-3px)" }}
                          onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.boxShadow = "0 2px 8px rgba(0,0,0,0.5)"; d.style.transform = "none" }}
                        >
                          <div style={{ fontFamily: "Georgia, serif", fontWeight: "bold", color: col, fontSize: 10, lineHeight: 1.1 }}>{abbr}<br/>{sym}</div>
                          <div style={{ textAlign: "center", fontSize: 22, color: col, lineHeight: 1 }}>{sym}</div>
                          <div style={{ fontFamily: "Georgia, serif", fontWeight: "bold", color: col, fontSize: 10, lineHeight: 1.1, transform: "rotate(180deg)", alignSelf: "flex-end" }}>{abbr}{sym}</div>
                        </div>
                        {card.position && (
                          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 5, letterSpacing: "0.08em", color: "#3a2a55", maxWidth: 58, textAlign: "center", lineHeight: 1.2 }}>
                            {card.position.length > 12 ? card.position.substring(0, 10) + "…" : card.position}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#2a1a4a", fontStyle: "italic", lineHeight: 1.5, margin: 0, animation: "moonPulse 3s ease-in-out infinite" }}>
                The cards are shuffled. Ask your question and Galileo will deal.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Card detail modal */}
      {expandedCard && (() => {
        const cardData = CARTOMANCY_DECK.find(c => c.name === expandedCard.name)
        const isRed = expandedCard.suit === "Hearts" || expandedCard.suit === "Diamonds"
        const sym = SUIT_SYMBOL[expandedCard.suit]
        const abbr = RANK_ABBR[expandedCard.rank] || expandedCard.rank
        const col = isRed ? "#c41e3a" : "#111"
        return (
          <div onClick={() => setExpandedCard(null)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(4,2,14,0.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(135deg, #130930, #0a0520)", border: "1px solid rgba(201,168,76,0.35)", borderRadius: 16, padding: "24px", maxWidth: 420, width: "100%", display: "flex", gap: 20, alignItems: "flex-start", boxShadow: "0 0 60px rgba(201,168,76,0.1)" }}>
              <div style={{ flexShrink: 0, width: 80, height: 112, borderRadius: 7, background: "#fff", border: "1px solid #ccc", boxShadow: "0 4px 16px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "6px 7px" }}>
                <div style={{ fontFamily: "Georgia, serif", fontWeight: "bold", color: col, lineHeight: 1 }}>
                  <div style={{ fontSize: abbr.length > 1 ? 12 : 14 }}>{abbr}</div>
                  <div style={{ fontSize: 13 }}>{sym}</div>
                </div>
                <div style={{ textAlign: "center", fontSize: 30, color: col, lineHeight: 1 }}>{sym}</div>
                <div style={{ fontFamily: "Georgia, serif", fontWeight: "bold", color: col, lineHeight: 1, transform: "rotate(180deg)", alignSelf: "flex-end" }}>
                  <div style={{ fontSize: abbr.length > 1 ? 12 : 14 }}>{abbr}</div>
                  <div style={{ fontSize: 13 }}>{sym}</div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.12em", color: "#c9a84c", marginBottom: 4 }}>
                  {expandedCard.name.toUpperCase()}
                </div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.15em", color: isRed ? "#e879a0" : "#9a8ab8", marginBottom: 12 }}>
                  {expandedCard.suit.toUpperCase()} {sym}
                  {expandedCard.position ? ` · ${expandedCard.position.toUpperCase()}` : ""}
                </div>
                {cardData && (
                  <>
                    <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#c8d4e8", lineHeight: 1.7, marginBottom: 12 }}>
                      {cardData.uprightMeaning}
                    </p>
                    {cardData.keywords?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
                        {cardData.keywords.slice(0, 4).map((kw: string, i: number) => (
                          <span key={i} style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: "0.1em", color: "#4a3870", border: "1px solid rgba(42,26,85,0.6)", borderRadius: 3, padding: "2px 6px" }}>{kw.toUpperCase()}</span>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 13, color: "#6a5a8a", fontStyle: "italic", lineHeight: 1.6, marginBottom: 14 }}>
                  {SUIT_DESC[expandedCard.suit]}
                </div>
                <button onClick={() => setExpandedCard(null)} style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.15em", color: "#4a3870", background: "none", border: "none", cursor: "pointer" }}>
                  CLOSE ✦
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Main content */}
      <div style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

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
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }} disabled={loading} placeholder="Speak freely. Galileo is listening..." rows={2} style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", color: "#ddd8f0", fontFamily: "'EB Garamond', serif", fontSize: 17, lineHeight: 1.6 }} />
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
