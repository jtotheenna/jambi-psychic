"use client"

import GalileoAvatar from "./GalileoAvatar"
import { VoiceMode, AvatarState } from "@/lib/useGalileoVoice"

type Props = {
  avatarState: AvatarState
  hasStarted: boolean
  mode: VoiceMode
  setMode: (m: VoiceMode) => void
  isListening: boolean
  interimTranscript: string
  voiceSupported: boolean
}

const MODES: { key: VoiceMode; label: string; desc: string }[] = [
  { key: "text",           label: "TEXT",          desc: "Read only" },
  { key: "aloud",          label: "READ ALOUD",    desc: "Galileo speaks" },
  { key: "conversational", label: "CONVERSATION",  desc: "Voice back and forth" },
]

export default function GalileoPanel({
  avatarState, hasStarted, mode, setMode, isListening, interimTranscript, voiceSupported,
}: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      {/* Avatar */}
      <GalileoAvatar state={hasStarted ? avatarState : "closed"} />

      {/* Mode selector */}
      <div style={{
        display: "flex",
        gap: 6,
        padding: "6px",
        background: "rgba(10,5,32,0.6)",
        borderRadius: 10,
        border: "1px solid rgba(42,26,85,0.6)",
      }}>
        {(voiceSupported ? MODES : MODES.slice(0, 2)).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            style={{
              padding: "6px 14px",
              borderRadius: 7,
              border: "none",
              background: mode === key
                ? key === "conversational"
                  ? "linear-gradient(135deg, rgba(79,70,229,0.4) 0%, rgba(26,13,63,0.8) 100%)"
                  : "linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(42,26,85,0.6) 100%)"
                : "transparent",
              color: mode === key
                ? key === "conversational" ? "#a5b4fc" : "#c9a84c"
                : "#4a3870",
              fontFamily: "'Cinzel', serif",
              fontSize: 8,
              letterSpacing: "0.15em",
              cursor: "pointer",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Listening indicator */}
      {mode === "conversational" && (
        <div style={{ textAlign: "center", minHeight: 40 }}>
          {isListening ? (
            <>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", margin: "0 auto 8px",
                background: "radial-gradient(circle, rgba(165,180,252,0.9) 0%, rgba(79,70,229,0.5) 100%)",
                boxShadow: "0 0 20px rgba(165,180,252,0.5)",
                animation: "moonPulse 1s ease-in-out infinite",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>🎙</div>
              {interimTranscript && (
                <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#a5b4fc", fontStyle: "italic", maxWidth: 240 }}>
                  {interimTranscript}
                </div>
              )}
            </>
          ) : avatarState === "idle" && hasStarted ? (
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.15em", color: "#4a3870" }}>
              SPEAK WHEN READY
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
