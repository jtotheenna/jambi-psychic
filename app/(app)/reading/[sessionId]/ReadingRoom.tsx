"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import GalileoCircle from "@/components/GalileoCircle"
import GemProgress from "@/components/GemProgress"
import { useGalileoVoice } from "@/lib/useGalileoVoice"


import ChatBubble from "@/components/ChatBubble"
import { TAROT_DECK } from "@/lib/tarot"
import { playBoxOpen, playCardReveal, playGalileoSpeak, playSessionEnd } from "@/lib/sounds"
import { speakStreaming } from "@/lib/speak"
import { readSSE, nextBoundary, rafThrottle } from "@/lib/readSSE"

// Browser Speech Recognition (voice input)
const SpeechRecognition =
  typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
    : null

type Message = {
  role: "user" | "galileo"
  content: string
  cards?: { name: string; position?: string; reversed?: boolean }[]
}

type Props = {
  sessionId: string
  userName: string | null
  initialTranscript: Message[]
  initialCardsDrawn: string[]
  exchangesUsed: number
  exchangesTotal: number
  isComplete: boolean
  spread: string | null
}

type AvatarState = "idle" | "thinking" | "speaking" | "closed"


function findCardData(name: string) {
  return TAROT_DECK.find((c) => c.name === name)
}

// Sticky bar: Galileo on the left, card thumbnails on the right
function ReadingBar({
  avatarState,
  cards,
  spread,
  onCardClick,
}: {
  avatarState: AvatarState
  cards: { card: { name: string; position?: string; reversed?: boolean }; idx: number }[]
  spread: string | null
  onCardClick: (cardData: NonNullable<ReturnType<typeof findCardData>>, meta: { position?: string; reversed?: boolean }) => void
}) {
  return (
    <div style={{
      position: "sticky",
      top: 57,
      zIndex: 30,
      display: "flex",
      justifyContent: "center",
      padding: "10px 14px",
      background: "rgba(4,2,14,0.95)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(42,26,85,0.4)",
      minHeight: 152,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, maxWidth: 720, width: "100%" }}>
        {/* Galileo — left, fixed size */}
        <div style={{ flexShrink: 0 }}>
          <GalileoCircle
            state={avatarState}
            size={124}
            showName={false}
            showStars={false}
          />
        </div>

        {/* Right side: spread label + card strip */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {cards.length > 0 ? (
            <>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: "0.2em", color: "#4a3870" }}>
                {spread ? spread.toUpperCase() : "THE CARDS"} · TAP TO READ
              </div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                {cards.map(({ card, idx }) => {
                  const cardData = findCardData(card.name)
                  if (!cardData) return null
                  const slug = cardData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
                  return (
                    <div
                      key={idx}
                      onClick={() => onCardClick(cardData, { position: card.position, reversed: card.reversed })}
                      style={{ flexShrink: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, animation: `fadeUp 0.5s ease-out ${idx * 320}ms both` }}
                    >
                      <div style={{ width: 56, height: 80, borderRadius: 5, overflow: "hidden", border: "1px solid rgba(201,168,76,0.3)", boxShadow: "0 2px 8px rgba(0,0,0,0.5)", transform: card.reversed ? "rotate(180deg)" : "none", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
                        onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.boxShadow = "0 4px 16px rgba(201,168,76,0.45)"; d.style.transform = `translateY(-3px)${card.reversed ? " rotate(180deg)" : ""}` }}
                        onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.boxShadow = "0 2px 8px rgba(0,0,0,0.5)"; d.style.transform = card.reversed ? "rotate(180deg)" : "none" }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/cards/${slug}.jpg`} alt={cardData.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
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
              The cards are ready. Ask your question and Galileo will read.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ReadingRoom({
  sessionId,
  userName,
  initialTranscript,
  initialCardsDrawn,
  exchangesUsed: initialExchangesUsed,
  exchangesTotal,
  isComplete: initialIsComplete,
  spread: initialSpread,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialTranscript)
  const [cardsDrawn, setCardsDrawn] = useState<string[]>(initialCardsDrawn)
  const [exchangesUsed, setExchangesUsed] = useState(initialExchangesUsed)
  const [isComplete, setIsComplete] = useState(initialIsComplete)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [avatarState, setAvatarState] = useState<AvatarState>(
    initialTranscript.length > 0 ? "idle" : "idle"
  )
  const [hasStarted, setHasStarted] = useState(initialTranscript.length > 0)
  const [spread, setSpread] = useState(initialSpread)
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")

  const [expandedCard, setExpandedCard] = useState<ReturnType<typeof findCardData> | null>(null)
  const [expandedCardMeta, setExpandedCardMeta] = useState<{ position?: string; reversed?: boolean } | null>(null)

  const voice = useGalileoVoice()
  const language = "en"
  const prefetchedRef   = useRef<{ response: string } | null>(null)
  const audioChainRef   = useRef<Promise<void>>(Promise.resolve())

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<InstanceType<NonNullable<typeof SpeechRecognition>> | null>(null)
  const voiceModeRef = useRef(false)
  const loadingRef = useRef(false)

  // Sync voice hook mode to local voiceMode
  useEffect(() => {
    const isConversational = voice.mode === "conversational"
    setVoiceMode(isConversational)
    voiceModeRef.current = isConversational
  }, [voice.mode])

  useEffect(() => { loadingRef.current = loading }, [loading])

  useEffect(() => {
    setVoiceSupported(!!SpeechRecognition)
  }, [])

  useEffect(() => {
    // Only scroll when a new complete message arrives (role changes), not on every delta
    const last = messages[messages.length - 1]
    if (!last) return
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
  }, [messages.length])

  useEffect(() => { voice.open() }, []) // eslint-disable-line — immediate Simli connection on mount
  // Keep hook in sync with local state
  useEffect(() => { voice.setAvatarState(avatarState) }, [avatarState]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (hasStarted) voice.open() }, [hasStarted]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fetch opening greeting text while page loads — TTS streams on tap so no decode delay
  useEffect(() => {
    if (initialTranscript.length > 0) return
    let cancelled = false
    async function prefetch() {
      try {
        const res = await fetch(`/api/reading/${sessionId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "__OPENING__", language }),
        })
        if (cancelled || !res.ok) return
        const data = await res.json()
        if (cancelled || !data.response) return
        prefetchedRef.current = { response: data.response }
      } catch { /* silent — handleBeginReading will fall back */ }
    }
    prefetch()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-start the reading on first user interaction — no button tap needed
  // Browsers require a gesture before audio plays, so we wait for the first touch/click
  useEffect(() => {
    if (hasStarted || initialTranscript.length > 0) return
    let fired = false
    const start = () => {
      if (fired) return
      fired = true
      window.removeEventListener("click",      start)
      window.removeEventListener("touchstart", start)
      window.removeEventListener("keydown",    start)
      handleBeginReading()
    }
    window.addEventListener("click",      start, { once: true })
    window.addEventListener("touchstart", start, { once: true })
    window.addEventListener("keydown",    start, { once: true })
    return () => {
      window.removeEventListener("click",      start)
      window.removeEventListener("touchstart", start)
      window.removeEventListener("keydown",    start)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function speakText(text: string, hasCards = false) {
    if (voice.mode === "text") {
      setAvatarState("idle")
      return
    }
    if (voice.mode === "aloud") {
      playGalileoSpeak()
      if (hasCards) {
        setTimeout(() => playCardReveal(0), 800)
        setTimeout(() => playCardReveal(1), 1400)
        setTimeout(() => playCardReveal(2), 2000)
      }
    }
    setAvatarState("speaking")

    await speakStreaming(text)
    setAvatarState("idle")
    if (voiceModeRef.current) setTimeout(() => startAutoListening(), 600)
  }

  async function handleBeginReading() {
    const silentAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    silentAudio.volume = 0
    silentAudio.play().catch(() => {})
    setHasStarted(true)
    setAvatarState("thinking")
    playBoxOpen()
    setLoading(true)

    let response = prefetchedRef.current?.response ?? null
    if (!response) {
      try {
        const res = await fetch(`/api/reading/${sessionId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "__OPENING__", language }),
        })
        const data = await res.json()
        if (res.ok) response = data.response ?? null
      } catch { /* fall through */ }
    }

    if (response) {
      setMessages([{ role: "galileo", content: response }])
      setLoading(false)
      await speakText(response)
    }
    setAvatarState("idle")
    setLoading(false)
  }

  // ── Conversational voice mode ──────────────────────────────────────────────

  function startAutoListening() {
    if (!SpeechRecognition || !voiceModeRef.current || loadingRef.current) return

    recognitionRef.current?.stop()

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.continuous = true
    recognition.interimResults = true

    let finalText = ""
    let silenceTimer: ReturnType<typeof setTimeout> | null = null

    recognition.onstart = () => {
      setIsListening(true)
      setInterimTranscript("")
      finalText = ""
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ""
      finalText = ""
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript + " "
        else interim += event.results[i][0].transcript
      }
      setInterimTranscript(finalText + interim)

      // Reset silence countdown whenever speech comes in
      if (silenceTimer) clearTimeout(silenceTimer)
      if (event.results[event.results.length - 1].isFinal) {
        silenceTimer = setTimeout(() => recognition.stop(), 1400)
      }
    }

    recognition.onspeechend = () => {
      if (silenceTimer) clearTimeout(silenceTimer)
      silenceTimer = setTimeout(() => recognition.stop(), 900)
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript("")
      const text = finalText.trim()
      if (text && voiceModeRef.current && !loadingRef.current) {
        sendMessageText(text)
      } else if (voiceModeRef.current && !loadingRef.current) {
        // Nothing heard — keep listening
        setTimeout(() => startAutoListening(), 600)
      }
    }

    recognition.onerror = (event: Event & { error?: string }) => {
      setIsListening(false)
      if (voiceModeRef.current && event.error !== "aborted" && event.error !== "no-speech") {
        setTimeout(() => startAutoListening(), 1000)
      } else if (voiceModeRef.current && event.error === "no-speech") {
        setTimeout(() => startAutoListening(), 400)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  function toggleVoiceMode() {
    if (voiceMode) {
      // Turn off
      voiceModeRef.current = false
      setVoiceMode(false)
      recognitionRef.current?.stop()
      setIsListening(false)
      setInterimTranscript("")
    } else {
      // Turn on
      setVoiceMode(true)
      voiceModeRef.current = true
      if (!loading && hasStarted) setTimeout(() => startAutoListening(), 300)
    }
  }

  // ── Text mode mic (hold to speak) ─────────────────────────────────────────

  function startListening() {
    if (!SpeechRecognition || isListening || loading || voiceMode) return
    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setInput((prev) => prev ? `${prev} ${transcript}` : transcript)
    }
    recognition.onend = () => { setIsListening(false); recognitionRef.current = null }
    recognition.onerror = () => { setIsListening(false); recognitionRef.current = null }
    recognitionRef.current = recognition
    recognition.start()
  }

  function stopListening() { recognitionRef.current?.stop() }

  // ── Send message (shared by text + voice) ─────────────────────────────────

  async function sendMessageText(text: string) {
    if (!text.trim() || loadingRef.current || isComplete) return
    const sa = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    sa.volume = 0; sa.play().catch(() => {})
    setInput("")
    setLoading(true)

    const newMessages: Message[] = [...messages, { role: "user", content: text }, { role: "galileo", content: "" }]
    setMessages(newMessages)
    setAvatarState("thinking")

    try {
      const res = await fetch(`/api/reading/${sessionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, voiceMode: voiceModeRef.current, language }),
      })

      if (!res.ok || !res.body) {
        setMessages([...newMessages.slice(0, -1), { role: "galileo", content: "Something stirred in the void. Please try again." }])
        setAvatarState("idle")
        setLoading(false)
        if (voiceModeRef.current) setTimeout(() => startAutoListening(), 600)
        return
      }

      audioChainRef.current = Promise.resolve()
      let pending = "", fullText = "", doneData: Record<string, unknown> = {}
      let hasCards = false
      const setTextThrottled = rafThrottle((t: string) => {
        setMessages(prev => [...prev.slice(0, -1), { role: "galileo", content: t, cards: prev[prev.length-1]?.cards }])
      })

      const queueSentence = (t: string) => {
        if (voice.mode === "text" || !t.trim()) return
        setAvatarState("speaking")
        audioChainRef.current = audioChainRef.current.then(() => speakStreaming(t))
      }

      setLoading(false)

      await readSSE(res.body, (data) => {
        if (data.type === "cards") {
          const cards = data.cards as { name: string; position?: string; reversed?: boolean }[]
          hasCards = cards.length > 0
          if (hasCards) {
            setCardsDrawn(prev => [...prev, ...cards.map(c => c.name)])
            setSpread(data.spread as string || null)
            if (voice.mode === "aloud") {
              setTimeout(() => playCardReveal(0), 800)
              setTimeout(() => playCardReveal(1), 1400)
              setTimeout(() => playCardReveal(2), 2000)
            }
          }
          // Update last galileo message with cards
          setMessages(prev => [...prev.slice(0, -1), { role: "galileo", content: fullText, cards: hasCards ? cards : undefined }])
        } else if (data.type === "delta") {
          fullText += data.text as string; pending += data.text as string
          setTextThrottled(fullText)
          const b = nextBoundary(pending); if (b !== -1) { queueSentence(pending.slice(0, b)); pending = pending.slice(b) }
        } else if (data.type === "done") {
          doneData = data; queueSentence(pending.trim()); pending = ""
          setExchangesUsed(data.exchangesUsed as number)
        }
      })

      await audioChainRef.current
      setAvatarState("idle")

      if (doneData.isComplete) {
        playSessionEnd()
        setIsComplete(true)
      }
      if (voiceModeRef.current && !doneData.isComplete) setTimeout(() => startAutoListening(), 600)
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { role: "galileo", content: "The stars went dark for a moment. Please try again." }])
      setAvatarState("idle")
      if (voiceModeRef.current) setTimeout(() => startAutoListening(), 600)
    }

    setLoading(false)
    if (!voiceModeRef.current) inputRef.current?.focus()
  }

  async function sendMessage() {
    await sendMessageText(input.trim())
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const readingBarCards = messages
    .filter(m => m.role === "galileo" && m.cards?.length)
    .flatMap(m => m.cards!)
    .map((card, idx) => ({ card, idx }))

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "0",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: "16px 24px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          borderBottom: "1px solid rgba(42,26,85,0.5)",
          background: "rgba(4,2,14,0.9)",
          backdropFilter: "blur(12px)",
        }}
      >
        <a
          href="/dashboard"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 10,
            letterSpacing: "0.2em",
            color: "#7a8ba8",
            textDecoration: "none",
          }}
        >
          ← RETURN
        </a>

        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", color: "#4a3870", textAlign: "center" }}>
          {spread ? spread.toUpperCase() : "READING"}
          {userName ? ` — ${userName.toUpperCase()}` : ""}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
          <GemProgress total={exchangesTotal} used={exchangesUsed} />
        </div>
      </div>

      {/* Reading bar — Galileo left, cards right, sticky below nav */}
      <ReadingBar
        avatarState={avatarState}
        cards={readingBarCards}
        spread={spread}
        onCardClick={(cardData, meta) => { setExpandedCard(cardData); setExpandedCardMeta(meta) }}
      />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          maxWidth: 720,
          width: "100%",
          margin: "0 auto",
          padding: "16px 16px",
          gap: 16,
        }}
      >
        {/* Voice mode selector — only visible after reading starts */}
        {hasStarted && (
          <div style={{
            position: "fixed", bottom: 16, right: 20, zIndex: 46,
            display: "flex", gap: 5,
            padding: "5px",
            background: "rgba(10,5,32,0.8)",
            borderRadius: 8,
            border: "1px solid rgba(42,26,85,0.6)",
            backdropFilter: "blur(8px)",
          }}>
            {(voiceSupported
              ? [
                  { key: "text" as const,           label: "MUTE" },
                  { key: "aloud" as const,          label: "ALOUD" },
                  { key: "conversational" as const, label: "VOICE" },
                ]
              : [
                  { key: "text" as const,  label: "MUTE" },
                  { key: "aloud" as const, label: "ALOUD" },
                ]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => voice.setMode(key)}
                style={{
                  padding: "5px 12px", borderRadius: 5, border: "none",
                  background: voice.mode === key
                    ? "rgba(201,168,76,0.2)"
                    : "transparent",
                  color: voice.mode === key ? "#c9a84c" : "#4a3870",
                  fontFamily: "'Cinzel', serif", fontSize: 8,
                  letterSpacing: "0.12em", cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Card detail modal */}
        {expandedCard && (
          <div
            onClick={() => setExpandedCard(null)}
            style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(4,2,14,0.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: "linear-gradient(135deg, #130930, #0a0520)", border: "1px solid rgba(201,168,76,0.35)", borderRadius: 16, padding: "24px", maxWidth: 380, width: "100%", display: "flex", gap: 20, alignItems: "flex-start", boxShadow: "0 0 60px rgba(201,168,76,0.1)" }}
            >
              <div style={{ flexShrink: 0, width: 90, height: 126, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(201,168,76,0.3)", transform: expandedCardMeta?.reversed ? "rotate(180deg)" : "none" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/cards/${expandedCard.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}.jpg`} alt={expandedCard.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.15em", color: "#c9a84c", marginBottom: 4 }}>
                  {expandedCard.name.toUpperCase()}
                </div>
                {expandedCardMeta?.position && (
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.12em", color: "#4a3870", marginBottom: 10 }}>
                    {expandedCardMeta.reversed ? "REVERSED · " : ""}{expandedCardMeta.position.toUpperCase()}
                  </div>
                )}
                <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#8878a8", lineHeight: 1.65, marginBottom: 12 }}>
                  {expandedCardMeta?.reversed ? expandedCard.reversedMeaning : expandedCard.uprightMeaning}
                </p>
                {expandedCard.keywords?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
                    {expandedCard.keywords.slice(0, 4).map((kw: string, i: number) => (
                      <span key={i} style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: "0.1em", color: "#4a3870", border: "1px solid rgba(42,26,85,0.6)", borderRadius: 3, padding: "2px 6px" }}>{kw.toUpperCase()}</span>
                    ))}
                  </div>
                )}
                <button onClick={() => setExpandedCard(null)} style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.15em", color: "#4a3870", background: "none", border: "none", cursor: "pointer" }}>
                  CLOSE ✦
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Begin button (fresh reading) */}
        {!hasStarted && (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <p style={{
              fontFamily: "'EB Garamond', serif",
              fontSize: 17,
              color: "#4a3870",
              fontStyle: "italic",
              animation: "moonPulse 3s ease-in-out infinite",
            }}>
              Tap anywhere to begin…
            </p>
          </div>
        )}

        {/* Chat messages */}
        {hasStarted && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              paddingRight: 4,
            }}
          >
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} isLatest={i === messages.length - 1} />
            ))}
            {loading && avatarState === "thinking" && (
              <div style={{ display: "flex", gap: 8, padding: "0 4px" }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, #1a0d3f, #0a0520)",
                    border: "1px solid rgba(165,180,252,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  ☽
                </div>
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: "4px 16px 16px 16px",
                    background: "linear-gradient(135deg, rgba(26,13,63,0.9) 0%, rgba(10,5,32,0.9) 100%)",
                    border: "1px solid rgba(165,180,252,0.2)",
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#a5b4fc",
                        animation: "moonPulse 1.2s ease-in-out infinite",
                        animationDelay: `${i * 0.3}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input area */}
        {hasStarted && !isComplete && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: "16px",
              background: voiceMode ? "rgba(79,70,229,0.08)" : "rgba(10,5,32,0.6)",
              borderRadius: 12,
              border: `1px solid ${voiceMode ? "rgba(165,180,252,0.35)" : "rgba(42,26,85,0.6)"}`,
              backdropFilter: "blur(8px)",
              transition: "all 0.4s ease",
            }}
          >
            <>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading || isListening}
                  placeholder={isListening ? "Listening..." : "Speak freely. Galileo is listening..."}
                  rows={2}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    resize: "none",
                    color: isListening ? "#a5b4fc" : "#ddd8f0",
                    fontFamily: "'EB Garamond', serif",
                    fontSize: 17,
                    lineHeight: 1.6,
                    fontStyle: isListening ? "italic" : "normal",
                    transition: "color 0.2s ease",
                  }}
                />
                {/* Hold-to-speak mic (text mode only) */}
                {voiceSupported && (
                  <button
                    onMouseDown={startListening}
                    onMouseUp={stopListening}
                    onTouchStart={startListening}
                    onTouchEnd={stopListening}
                    disabled={loading}
                    title="Hold to speak"
                    style={{
                      width: 40, height: 40, borderRadius: "50%",
                      border: `1px solid ${isListening ? "rgba(165,180,252,0.8)" : "rgba(42,26,85,0.8)"}`,
                      background: isListening ? "radial-gradient(circle, rgba(79,70,229,0.4) 0%, rgba(26,13,63,0.8) 100%)" : "rgba(26,13,63,0.6)",
                      color: isListening ? "#a5b4fc" : "#4a3870",
                      fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: isListening ? "0 0 16px rgba(165,180,252,0.4)" : "none",
                      transition: "all 0.2s ease",
                    }}
                  >🎙</button>
                )}
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  style={{
                    padding: "10px 20px", borderRadius: 8,
                    border: "1px solid rgba(201,168,76,0.4)",
                    background: loading || !input.trim() ? "rgba(42,26,85,0.3)" : "linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(79,70,229,0.15) 100%)",
                    color: loading || !input.trim() ? "#4a3870" : "#c9a84c",
                    fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.15em",
                    cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease", whiteSpace: "nowrap", height: 40,
                  }}
                >
                  {loading ? "☽" : "SEND ✦"}
                </button>
              </div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.12em", color: "#2a1a55", textAlign: "center" }}>
                {isListening ? "RELEASE TO STOP" : "TYPE OR HOLD MIC · ENTER TO SEND"}
              </div>
            </>
          </div>
        )}

        {/* Reading complete */}
        {isComplete && (
          <div
            style={{
              textAlign: "center",
              padding: "32px",
              borderRadius: 12,
              border: "1px solid rgba(201,168,76,0.2)",
              background: "rgba(10,5,32,0.6)",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>☽</div>
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 13,
                letterSpacing: "0.2em",
                color: "#c9a84c",
                marginBottom: 12,
              }}
            >
              THE READING IS COMPLETE
            </div>
            <p
              style={{
                fontFamily: "'EB Garamond', serif",
                fontSize: 16,
                color: "#7a8ba8",
                fontStyle: "italic",
                marginBottom: 24,
              }}
            >
              The reading is complete. The cards have spoken everything they carry.
            </p>
            <a
              href="/dashboard"
              style={{
                padding: "12px 32px",
                borderRadius: 8,
                border: "1px solid rgba(201,168,76,0.4)",
                background: "rgba(201,168,76,0.08)",
                color: "#c9a84c",
                fontFamily: "'Cinzel', serif",
                fontSize: 11,
                letterSpacing: "0.2em",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              RETURN TO YOUR READINGS
            </a>
          </div>
        )}
      </div>

      {/* GalileoCircle handles the live Simli face — no separate FloatingSimli needed */}
    </div>
  )
}
