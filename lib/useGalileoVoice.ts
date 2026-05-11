"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { playGalileoSpeak, playCardReveal, playSessionEnd } from "./sounds"

export type VoiceMode = "text" | "aloud" | "conversational"
export type AvatarState = "closed" | "idle" | "thinking" | "speaking"

const SpeechRecognition =
  typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
    : null

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
  } catch { return null }
}

export function useGalileoVoice() {
  const [mode, setMode] = useState<VoiceMode>("aloud")
  const [avatarState, setAvatarState] = useState<AvatarState>("idle")
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const modeRef = useRef<VoiceMode>("aloud")
  const loadingRef = useRef(false)
  const recognitionRef = useRef<InstanceType<NonNullable<typeof SpeechRecognition>> | null>(null)
  const onSpeakEndRef = useRef<(() => void) | null>(null)

  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { setVoiceSupported(!!SpeechRecognition) }, [])

  function open() {
    setHasStarted(true)
    setAvatarState("idle")
  }

  function setLoading(loading: boolean) {
    loadingRef.current = loading
    setAvatarState(loading ? "thinking" : "idle")
  }

  async function speak(text: string, hasCards = false) {
    if (mode === "text") return

    if (mode === "aloud") {
      playGalileoSpeak()
      if (hasCards) {
        setTimeout(() => playCardReveal(0), 800)
        setTimeout(() => playCardReveal(1), 1400)
        setTimeout(() => playCardReveal(2), 2000)
      }
    }

    setAvatarState("speaking")
    const audio = await fetchTTS(text)
    if (audio) {
      const played = await playAudio(audio)
      if (!played) {
        await new Promise((r) => setTimeout(r, Math.min(text.length * 38, 5000)))
      }
    } else {
      await new Promise((r) => setTimeout(r, Math.min(text.length * 38, 5000)))
    }
    setAvatarState("idle")

    if (mode === "conversational") {
      setTimeout(() => startListening(), 400)
    }

    onSpeakEndRef.current?.()
  }

  function startListening(onResult?: (text: string) => void) {
    if (!SpeechRecognition || !voiceSupported || loadingRef.current) return
    if (modeRef.current !== "conversational") return

    recognitionRef.current?.stop()

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.continuous = true
    recognition.interimResults = true

    let finalText = ""
    let silenceTimer: ReturnType<typeof setTimeout> | null = null

    recognition.onstart = () => { setIsListening(true); setInterimTranscript(""); finalText = "" }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ""
      finalText = ""
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript + " "
        else interim += event.results[i][0].transcript
      }
      setInterimTranscript(finalText + interim)
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
      if (text && modeRef.current === "conversational" && !loadingRef.current) {
        onResult?.(text)
      } else if (modeRef.current === "conversational" && !loadingRef.current) {
        setTimeout(() => startListening(onResult), 500)
      }
    }

    recognition.onerror = (event: Event & { error?: string }) => {
      setIsListening(false)
      if (modeRef.current === "conversational" && event.error !== "aborted") {
        setTimeout(() => startListening(onResult), 800)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  function stopListening() {
    recognitionRef.current?.stop()
  }

  function endSession() {
    playSessionEnd()
    stopListening()
  }

  return {
    mode, setMode,
    avatarState, setAvatarState,
    isListening,
    interimTranscript,
    voiceSupported,
    hasStarted,
    open,
    speak,
    setLoading,
    startListening,
    stopListening,
    endSession,
    modeRef,
  }
}
