"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import GalileoCircle from "@/components/GalileoCircle"
import GemProgress from "@/components/GemProgress"
import { useGalileoVoice } from "@/lib/useGalileoVoice"
import { getStoredLanguage } from "@/lib/language"
import LanguageSelector from "@/components/LanguageSelector"
import TarotCard from "@/components/TarotCard"
import ChatBubble from "@/components/ChatBubble"
import { TAROT_DECK } from "@/lib/tarot"
import { playBoxOpen, playCardReveal, playGalileoSpeak, playSessionEnd } from "@/lib/sounds"
import { getSpreadLayout } from "@/lib/tarot"
import { audioBlobToPCM } from "@/components/FloatingSimli"

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

function playAudio(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio(src)
    audio.onended = () => { URL.revokeObjectURL(src); resolve(true) }
    audio.onerror = () => { URL.revokeObjectURL(src); resolve(false) }
    audio.play().catch(() => { URL.revokeObjectURL(src); resolve(false) })
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
  } catch {
    return null
  }
}

function findCardData(name: string) {
  return TAROT_DECK.find((c) => c.name === name)
}

// Single persistent Galileo circle — never unmounts so Simli stays connected
function GalileoAnchor({
  hasStarted,
  avatarState,
  simliSendRef,
  pendingPcmRef,
  simliActiveRef,
}: {
  hasStarted: boolean
  avatarState: AvatarState
  simliSendRef: React.MutableRefObject<((pcm: Uint8Array) => void) | null>
  pendingPcmRef: React.MutableRefObject<Uint8Array | null>
  simliActiveRef: React.MutableRefObject<boolean>
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const origin = useRef({ mx: 0, my: 0, px: 0, py: 0 })

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    origin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
    const move = (ev: MouseEvent) => setPos({
      x: origin.current.px + ev.clientX - origin.current.mx,
      y: origin.current.py + ev.clientY - origin.current.my,
    })
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up) }
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
  }, [pos.x, pos.y])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    origin.current = { mx: t.clientX, my: t.clientY, px: pos.x, py: pos.y }
    const move = (ev: TouchEvent) => {
      const t2 = ev.touches[0]
      setPos({ x: origin.current.px + t2.clientX - origin.current.mx, y: origin.current.py + t2.clientY - origin.current.my })
    }
    const up = () => { window.removeEventListener("touchmove", move); window.removeEventListener("touchend", up) }
    window.addEventListener("touchmove", move, { passive: false })
    window.addEventListener("touchend", up)
  }, [pos.x, pos.y])

  return (
    <div style={{
      position: "sticky",
      top: 57,
      zIndex: 30,
      display: "flex",
      justifyContent: "center",
      padding: "10px 0",
      background: "rgba(4,2,14,0.93)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(42,26,85,0.4)",
    }}>
      <div
        onMouseDown={hasStarted ? onMouseDown : undefined}
        onTouchStart={hasStarted ? onTouchStart : undefined}
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          cursor: hasStarted ? "grab" : "default",
          touchAction: hasStarted ? "none" : "auto",
        }}
      >
        <GalileoCircle
          state={hasStarted ? avatarState : "idle"}
          size={200}
          showName={false}
          showStars={false}
          onSendAudio={(fn) => {
            simliSendRef.current = fn
            if (pendingPcmRef.current) {
              fn(pendingPcmRef.current)
              pendingPcmRef.current = null
            }
          }}
          onSimliConnected={(yes) => { simliActiveRef.current = yes }}
        />
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
    initialTranscript.length > 0 ? "idle" : "closed"
  )
  const [hasStarted, setHasStarted] = useState(initialTranscript.length > 0)
  const [spread, setSpread] = useState(initialSpread)
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")

  const voice = useGalileoVoice()
  const language = typeof window !== "undefined" ? getStoredLanguage() : "en"
  const simliSendRef    = useRef<((pcm: Uint8Array) => void) | null>(null)
  const simliActiveRef  = useRef(false)
  const pendingPcmRef   = useRef<Uint8Array | null>(null)   // PCM buffered before Simli connects
  const prefetchedRef   = useRef<{ response: string; audioSrc: string | null } | null>(null)

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
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
  }, [messages])

  const isVoiceMode = voiceMode

  // Keep hook in sync with local state
  useEffect(() => { voice.setAvatarState(avatarState) }, [avatarState]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (hasStarted) voice.open() }, [hasStarted]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fetch opening greeting + TTS while the page loads so voice is instant on first tap
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
        const audioSrc = await fetchTTS(data.response)
        if (cancelled) { if (audioSrc) URL.revokeObjectURL(audioSrc); return }
        prefetchedRef.current = { response: data.response, audioSrc }
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

    const audioUrl = await fetchTTS(text)
    if (audioUrl) {
      try {
        const blob = await fetch(audioUrl).then(r => r.blob())
        const pcm  = await audioBlobToPCM(blob)
        if (simliSendRef.current) {
          // Simli IS the speaker — skip separate playback to avoid double audio
          simliSendRef.current(pcm)
          const durationMs = Math.max((pcm.length / 32000) * 1000 + 1500, 2000)
          await new Promise(r => setTimeout(r, durationMs))
          URL.revokeObjectURL(audioUrl)
        } else {
          pendingPcmRef.current = pcm
          const played = await playAudio(audioUrl)
          if (!played) await new Promise(r => setTimeout(r, Math.min(text.length * 38, 5000)))
        }
      } catch {
        const played = await playAudio(audioUrl)
        if (!played) await new Promise(r => setTimeout(r, Math.min(text.length * 38, 5000)))
      }
    } else {
      await new Promise((r) => setTimeout(r, Math.min(text.length * 38, 5000)))
    }
    setAvatarState("idle")
    if (voiceModeRef.current) setTimeout(() => startAutoListening(), 600)
  }

  function handleAvatarSpeakEnd() {
    setAvatarState("idle")
    if (voiceModeRef.current) setTimeout(() => startAutoListening(), 400)
  }

  async function handleBeginReading() {
    // Unlock HTML5 audio for Safari — must call .play() on an Audio element in the user gesture
    const silentAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    silentAudio.volume = 0
    silentAudio.play().catch(() => {})

    setHasStarted(true)
    setAvatarState("thinking")
    playBoxOpen()
    setLoading(true)

    // Use pre-fetched greeting if ready, otherwise fetch now
    const prefetched = prefetchedRef.current
    let response: string | null = prefetched?.response ?? null
    let audioSrc: string | null = prefetched?.audioSrc ?? null

    if (!response) {
      try {
        const res = await fetch(`/api/reading/${sessionId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "__OPENING__", language }),
        })
        const data = await res.json()
        if (res.ok && data.response) {
          response = data.response
          audioSrc = await fetchTTS(data.response)
        }
      } catch { /* fall through to idle */ }
    }

    if (response) {
      setMessages([{ role: "galileo", content: response }])
      setLoading(false)
      setAvatarState("speaking")
      if (audioSrc) {
        try {
          const blob = await fetch(audioSrc).then(r => r.blob())
          const pcm  = await audioBlobToPCM(blob)
          if (simliSendRef.current) {
            simliSendRef.current(pcm)
            const durationMs = Math.max((pcm.length / 32000) * 1000 + 1500, 2000)
            await new Promise(r => setTimeout(r, durationMs))
            URL.revokeObjectURL(audioSrc)
          } else {
            pendingPcmRef.current = pcm
            await playAudio(audioSrc)
          }
        } catch {
          await playAudio(audioSrc!)
        }
      } else {
        await new Promise((r) => setTimeout(r, Math.min(response!.length * 38, 6000)))
      }
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
    // Unlock audio within user gesture
    const sa = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    sa.volume = 0; sa.play().catch(() => {})
    setInput("")
    setLoading(true)

    const newMessages: Message[] = [...messages, { role: "user", content: text }]
    setMessages(newMessages)
    setAvatarState("thinking")

    try {
      const res = await fetch(`/api/reading/${sessionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, voiceMode: voiceModeRef.current, language }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessages([...newMessages, { role: "galileo", content: data.error || "Something stirred in the void. Please try again." }])
        setAvatarState("idle")
        setLoading(false)
        if (voiceModeRef.current) setTimeout(() => startAutoListening(), 600)
        return
      }

      const galileoMessage: Message = {
        role: "galileo",
        content: data.response,
        cards: data.cards?.length > 0 ? data.cards : undefined,
      }
      setMessages([...newMessages, galileoMessage])

      if (data.cards?.length > 0) {
        setCardsDrawn((prev) => [...prev, ...data.cards.map((c: { name: string }) => c.name)])
      }

      setExchangesUsed(data.exchangesUsed)
      setIsComplete(data.isComplete)
      if (data.isComplete) playSessionEnd()

      await speakText(data.response, data.cards?.length > 0)
    } catch {
      setMessages([...newMessages, { role: "galileo", content: "The stars went dark for a moment. Please try again." }])
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

  // Get unique cards for the card display (from all drawn this session)
  const drawnCardData = cardsDrawn
    .filter((v, i, a) => a.indexOf(v) === i)
    .map((name) => findCardData(name))
    .filter(Boolean)

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
          <LanguageSelector compact />
          <GemProgress total={exchangesTotal} used={exchangesUsed} />
        </div>
      </div>

      {/* Main content — bottom padding accounts for fixed avatar + voice selector */}
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
        {/* Single persistent Galileo — Simli stays connected through the whole reading */}
        <GalileoAnchor
          hasStarted={hasStarted}
          avatarState={avatarState}
          simliSendRef={simliSendRef}
          pendingPcmRef={pendingPcmRef}
          simliActiveRef={simliActiveRef}
        />

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
                  { key: "text" as const,           label: "TEXT" },
                  { key: "aloud" as const,          label: "ALOUD" },
                  { key: "conversational" as const, label: "VOICE" },
                ]
              : [
                  { key: "text" as const,  label: "TEXT" },
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

        {/* Full-width card spread — sticky, laid out in spread shape */}
        {drawnCardData.length > 0 && (
          <div style={{ background: "rgba(4,2,14,0.92)", backdropFilter: "blur(12px)", borderRadius: 10, padding: "10px 8px 8px", border: "1px solid rgba(42,26,85,0.5)", marginBottom: 4 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.25em", color: "#7a8ba8", textAlign: "center", marginBottom: 10 }}>
              {spread ? spread.toUpperCase() : "THE CARDS"}
            </div>
            {(() => {
              const allDealtCards = messages
                .filter((m) => m.role === "galileo" && m.cards && m.cards.length > 0)
                .flatMap((m, mi) => (m.cards || []).map((card, ci) => ({ card, mi, ci })))
                .filter(({ card }) => findCardData(card.name))

              const layout = getSpreadLayout(spread)
              const clarifiers = allDealtCards.filter(({ card }) => card.position === "Clarifying")
              const mainCards = allDealtCards.filter(({ card }) => card.position !== "Clarifying")

              if (layout && mainCards.length === layout.length) {
                // Compute grid dimensions
                const maxCol = Math.max(...layout.map(p => p.col))
                const maxRow = Math.max(...layout.map(p => p.row))
                return (
                  <div style={{ overflowX: "auto", paddingBottom: 4 }}>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${maxCol}, 72px)`,
                      gridTemplateRows: `repeat(${maxRow}, auto)`,
                      gap: "8px 6px",
                      justifyContent: "center",
                      width: "fit-content",
                      margin: "0 auto",
                    }}>
                      {mainCards.map(({ card, mi, ci }, idx) => {
                        const pos = layout[idx]
                        const cardData = findCardData(card.name)!
                        return (
                          <div key={`${mi}-${ci}`} style={{ gridColumn: pos.col, gridRow: pos.row, display: "flex", flexDirection: "column", alignItems: "center", transform: pos.rotate ? "rotate(90deg)" : "none" }}>
                            <TarotCard card={cardData} position={card.position} revealDelay={idx * 200} isReversed={card.reversed} />
                          </div>
                        )
                      })}
                    </div>
                    {clarifiers.length > 0 && (
                      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 8 }}>
                        {clarifiers.map(({ card, mi, ci }) => {
                          const cardData = findCardData(card.name)!
                          return (
                            <div key={`${mi}-${ci}`} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.15em", color: "#a5b4fc", marginBottom: 4 }}>✦ CLARIFYING</div>
                              <TarotCard card={cardData} revealDelay={0} isReversed={card.reversed} />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              // Fallback: wrap in rows of 5
              return (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", overflowX: "auto", paddingBottom: 4 }}>
                  {allDealtCards.map(({ card, mi, ci }, idx) => {
                    const cardData = findCardData(card.name)!
                    const isClarifying = card.position === "Clarifying"
                    return (
                      <div key={`${mi}-${ci}`} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        {isClarifying && <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.15em", color: "#a5b4fc", marginBottom: 4 }}>✦ CLARIFYING</div>}
                        <TarotCard card={cardData} position={isClarifying ? undefined : card.position} revealDelay={idx * 200} isReversed={card.reversed} />
                      </div>
                    )
                  })}
                </div>
              )
            })()
            }
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
              All ten visions have been spent. The cards will remember what was said.
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
