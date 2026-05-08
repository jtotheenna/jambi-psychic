"use client"

import { useEffect, useState } from "react"
import { LANGUAGES, type Language, getStoredLanguage, setStoredLanguage } from "@/lib/language"

type Props = {
  onChange?: (lang: Language) => void
  compact?: boolean
}

export default function LanguageSelector({ onChange, compact = false }: Props) {
  const [lang, setLang] = useState<Language>("en")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const stored = getStoredLanguage()
    setLang(stored)
    onChange?.(stored)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function select(code: Language) {
    setLang(code)
    setStoredLanguage(code)
    setOpen(false)
    onChange?.(code)
  }

  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 5, padding: compact ? "4px 8px" : "5px 10px",
          background: "rgba(10,5,32,0.6)", border: "1px solid rgba(42,26,85,0.6)",
          borderRadius: 6, cursor: "pointer", color: "#9a8ab8",
          fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em",
          transition: "border-color 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(165,180,252,0.4)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(42,26,85,0.6)")}
      >
        <span style={{ fontSize: 13 }}>{current.flag}</span>
        {!compact && <span>{current.label}</span>}
        <span style={{ fontSize: 8, opacity: 0.5 }}>▾</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
            background: "linear-gradient(135deg, #130930 0%, #0a0520 100%)",
            border: "1px solid rgba(42,26,85,0.8)", borderRadius: 8,
            overflow: "hidden", minWidth: 140,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}>
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => select(l.code)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", background: l.code === lang ? "rgba(79,70,229,0.15)" : "transparent",
                  border: "none", borderBottom: "1px solid rgba(42,26,85,0.4)", cursor: "pointer",
                  color: l.code === lang ? "#a5b4fc" : "#7a8ba8",
                  fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.12em",
                  textAlign: "left", transition: "background 0.15s",
                }}
                onMouseEnter={e => { if (l.code !== lang) (e.currentTarget as HTMLButtonElement).style.background = "rgba(42,26,85,0.3)" }}
                onMouseLeave={e => { if (l.code !== lang) (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
              >
                <span style={{ fontSize: 16 }}>{l.flag}</span>
                <span>{l.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
