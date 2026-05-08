"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import LanguageSelector from "@/components/LanguageSelector"
import { type Language } from "@/lib/language"

export default function LandingPage() {
  const [playing, setPlaying] = useState(false)
  const [glowing, setGlowing] = useState(false)
  const [, setLanguage] = useState<Language>("en")
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio("/galileo-welcome.mp3")
    audioRef.current.onended = () => { setPlaying(false); setGlowing(false) }
    return () => { audioRef.current?.pause() }
  }, [])

  function hearGalileo() {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlaying(false); setGlowing(false)
    } else {
      audioRef.current.play().catch(() => {})
      setPlaying(true); setGlowing(true)
    }
  }

  const readings = [
    {
      icon: "★", name: "Tarot Reading", price: "$10", color: "#c9a84c", glow: "rgba(201,168,76,0.35)", border: "rgba(201,168,76,0.3)",
      tagline: "Any question. A full 78-card deck. Up to 10 exchanges.",
      desc: "Ask what you need to know, and Galileo will draw from a fully shuffled tarot deck to speak your reading aloud. Each card is interpreted through your question, your energy, and the story unfolding across the spread.",
      btn: "CHOOSE TAROT",
    },
    {
      icon: "♠", name: "Cartomancy", price: "$10", color: "#e879a0", glow: "rgba(232,121,160,0.3)", border: "rgba(232,121,160,0.25)",
      tagline: "The old language of playing cards. Direct, sharp, and strangely accurate.",
      desc: "Galileo draws from a shuffled 52-card deck of hearts, spades, diamonds, and clubs. Older in spirit, blunt in tone, and grounded in everyday fate, this reading speaks plainly about the question in front of you.",
      btn: "CHOOSE CARTOMANCY",
    },
    {
      icon: "☽", name: "Moon Reading", price: "$5", color: "#a5b4fc", glow: "rgba(165,180,252,0.3)", border: "rgba(165,180,252,0.25)",
      tagline: "The current moon phase. The live sky. A message for your season.",
      desc: "Galileo reads the moon as it is right now, blending the current lunar phase with Medicine Wheel wisdom to reflect what this moment is asking of you. Open the reading, and the sky is already set.",
      btn: "CHOOSE MOON",
    },
    {
      icon: "✋", name: "Palm Reading", price: "$5", color: "#c8d4e8", glow: "rgba(200,212,232,0.25)", border: "rgba(200,212,232,0.2)",
      tagline: "Upload your palm. Hear what the lines reveal.",
      desc: "Take a photo of your dominant hand, and Galileo will read the lines, mounts, shape, and symbols of your palm. Your reading is spoken aloud, with room to ask follow-up questions and go deeper.",
      btn: "CHOOSE PALM",
    },
  ]

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>

      {/* Language selector — top right */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }}>
        <LanguageSelector onChange={setLanguage} />
      </div>

      {/* ── HERO ── */}
      <div style={{ width: "100%", maxWidth: 760, textAlign: "center", padding: "64px 24px 52px" }}>

        {/* Portrait with dramatic glow ring */}
        <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto 40px" }}>
          {/* Outer glow ring */}
          <div style={{
            position: "absolute", inset: -8, borderRadius: "50%",
            background: glowing
              ? "conic-gradient(from 0deg, rgba(201,168,76,0.6), rgba(165,180,252,0.4), rgba(201,168,76,0.6))"
              : "conic-gradient(from 0deg, rgba(201,168,76,0.15), rgba(165,180,252,0.08), rgba(201,168,76,0.15))",
            animation: "spin 8s linear infinite",
            transition: "all 0.6s ease",
            filter: glowing ? "blur(2px)" : "blur(4px)",
          }} />
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden",
            border: "2px solid rgba(201,168,76,0.5)",
            boxShadow: glowing
              ? "0 0 60px rgba(201,168,76,0.6), 0 0 120px rgba(165,180,252,0.3), inset 0 0 30px rgba(201,168,76,0.1)"
              : "0 0 30px rgba(201,168,76,0.2), 0 8px 40px rgba(0,0,0,0.8)",
            transition: "box-shadow 0.6s ease",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/galileo.jpg" alt="Galileo" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", filter: glowing ? "brightness(1.12) saturate(1.1)" : "brightness(1)", transition: "filter 0.6s ease" }} />
          </div>
        </div>

        {/* Name */}
        <h1 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: "clamp(44px, 9vw, 88px)", letterSpacing: "0.15em", marginBottom: 8, lineHeight: 1 }} className="text-shimmer">
          GALILEO
        </h1>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.5em", color: "#9a8ab8", marginBottom: 32 }}>
          THE CELESTIAL ORACLE
        </div>

        {/* Hook line */}
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(22px, 5vw, 32px)", lineHeight: 1.7, color: "#ddd8f0", fontStyle: "italic", maxWidth: 540, margin: "0 auto 18px" }}>
          Bring him what you're carrying. He has been waiting.
        </p>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(15px, 3vw, 17px)", color: "#8878a8", lineHeight: 1.75, maxWidth: 460, margin: "0 auto 44px" }}>
          Every reading is a real conversation — spoken aloud, in his voice, remembered across every visit.
        </p>

        {/* Primary CTA */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <Link href="/signup" style={{
            padding: "20px 64px", borderRadius: 8,
            border: "1px solid rgba(201,168,76,0.7)",
            background: "linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(79,70,229,0.18) 100%)",
            color: "#f0cc6e", fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: "0.28em",
            textDecoration: "none", display: "inline-block",
            boxShadow: "0 0 60px rgba(201,168,76,0.12), 0 4px 24px rgba(0,0,0,0.5)",
            transition: "all 0.2s ease",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 80px rgba(201,168,76,0.25), 0 8px 32px rgba(0,0,0,0.6)"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 60px rgba(201,168,76,0.12), 0 4px 24px rgba(0,0,0,0.5)"; (e.currentTarget as HTMLAnchorElement).style.transform = "none" }}
          >
            START MY READING ✦
          </Link>

          {/* Hear him button */}
          <button onClick={hearGalileo} style={{
            padding: "13px 36px", borderRadius: 8, cursor: "pointer",
            border: `1px solid ${playing ? "rgba(165,180,252,0.7)" : "rgba(165,180,252,0.3)"}`,
            background: playing ? "rgba(79,70,229,0.2)" : "rgba(79,70,229,0.06)",
            color: playing ? "#c8d4e8" : "#9a8ab8",
            fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.22em",
            transition: "all 0.25s ease", display: "flex", alignItems: "center", gap: 10,
            boxShadow: playing ? "0 0 30px rgba(165,180,252,0.2)" : "none",
          }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", border: `1px solid ${playing ? "rgba(165,180,252,0.6)" : "rgba(165,180,252,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>
              {playing ? "◼" : "▶"}
            </span>
            {playing ? "GALILEO IS SPEAKING..." : "HEAR GALILEO FIRST"}
          </button>

          <Link href="/login" style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#6a5a8a", textDecoration: "none", fontStyle: "italic", marginTop: 4 }}>
            I have been here before
          </Link>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: "100%", maxWidth: 480, height: 1, background: "linear-gradient(to right, transparent, rgba(79,70,229,0.5), transparent)", marginBottom: 64 }} />

      {/* ── READINGS ── */}
      <div style={{ width: "100%", maxWidth: 680, padding: "0 24px", marginBottom: 80 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.4em", color: "#9a8ab8", textAlign: "center", marginBottom: 36 }}>
          CHOOSE YOUR READING
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {readings.map(({ icon, name, price, color, glow, border, tagline, desc, btn }) => (
            <div
              key={name}
              style={{ padding: "28px", borderRadius: 12, border: `1px solid ${border}`, background: "linear-gradient(135deg, rgba(10,5,32,0.8) 0%, rgba(20,10,50,0.5) 100%)", transition: "transform 0.2s ease, box-shadow 0.2s ease", cursor: "pointer", position: "relative", overflow: "hidden" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 48px ${glow}, 0 0 0 1px ${border}` }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none" }}
              onTouchStart={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 48px ${glow}, 0 0 0 1px ${border}` }}
              onTouchEnd={e => { setTimeout(() => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none" }, 300) }}
            >
              {/* Subtle color wash in corner */}
              <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, background: `radial-gradient(circle at top right, ${glow.replace("0.3", "0.08")}, transparent 70%)`, pointerEvents: "none" }} />

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 22, color, filter: `drop-shadow(0 0 8px ${color})` }}>{icon}</span>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: "0.15em", color: "#ddd8f0" }}>{name.toUpperCase()}</span>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.12em", color, marginLeft: "auto", background: `${glow.replace("0.3", "0.12")}`, border: `1px solid ${border}`, borderRadius: 4, padding: "2px 10px" }}>{price}</span>
              </div>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: "#b8b0d8", fontStyle: "italic", marginBottom: 10, lineHeight: 1.5 }}>{tagline}</p>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#7a8ba8", lineHeight: 1.75, marginBottom: 20 }}>{desc}</p>
              <Link href="/signup" style={{ display: "inline-block", padding: "10px 26px", borderRadius: 6, border: `1px solid ${border}`, background: `${glow.replace("0.3", "0.1")}`, color, fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", textDecoration: "none", transition: "all 0.2s" }}>
                {btn} ✦
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: "100%", maxWidth: 480, height: 1, background: "linear-gradient(to right, transparent, rgba(79,70,229,0.5), transparent)", marginBottom: 64 }} />

      {/* ── HOW IT WORKS ── */}
      <div style={{ width: "100%", maxWidth: 560, padding: "0 24px", marginBottom: 80, textAlign: "center" }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.4em", color: "#9a8ab8", marginBottom: 36 }}>HOW IT WORKS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            ["Choose your reading — tarot, moon, palm, or cartomancy"],
            ["Create an account and complete your payment"],
            ["Ask your question or upload your palm photo"],
            ["Galileo speaks your answer aloud, in his own voice"],
            ["Continue the conversation until your session is complete"],
          ].map(([text], i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16, textAlign: "left", padding: "16px 0", borderBottom: i < 4 ? "1px solid rgba(42,26,85,0.4)" : "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.35)", background: "rgba(201,168,76,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'Cinzel', serif", fontSize: 10, color: "#c9a84c", marginTop: 2 }}>{i + 1}</div>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: "#c8d4e8", lineHeight: 1.65, margin: 0 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div style={{ width: "100%", maxWidth: 600, padding: "40px 24px", marginBottom: 64, borderRadius: 16, border: "1px solid rgba(201,168,76,0.2)", background: "linear-gradient(135deg, rgba(20,10,50,0.8) 0%, rgba(10,5,32,0.9) 100%)", textAlign: "center", boxShadow: "0 0 80px rgba(79,70,229,0.1)" }}>
        <div style={{ fontSize: 32, marginBottom: 16, filter: "drop-shadow(0 0 12px rgba(201,168,76,0.4))" }}>☽</div>
        <h2 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: "clamp(18px, 4vw, 26px)", letterSpacing: "0.12em", marginBottom: 12 }} className="text-shimmer">
          HE IS WAITING
        </h2>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: "#8878a8", fontStyle: "italic", lineHeight: 1.7, marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>
          Galileo remembers every reading. The longer you come, the more precisely he sees you.
        </p>
        <Link href="/signup" style={{
          padding: "18px 56px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.6)",
          background: "linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(79,70,229,0.15) 100%)",
          color: "#f0cc6e", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.25em",
          textDecoration: "none", display: "inline-block",
          boxShadow: "0 0 40px rgba(201,168,76,0.1)",
        }}>
          BEGIN YOUR READING ✦
        </Link>
      </div>

      {/* Quote */}
      <div style={{ maxWidth: 480, padding: "0 32px", textAlign: "center", marginBottom: 48 }}>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: "#6a5a8a", fontStyle: "italic", lineHeight: 1.8 }}>
          "The stars don't lie. They do, however, occasionally withhold."
        </p>
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#4a3a6a", marginTop: 8 }}>— GALILEO</p>
      </div>

      {/* Disclaimer */}
      <div style={{ maxWidth: 520, padding: "16px 24px", marginBottom: 20, borderRadius: 8, border: "1px solid rgba(120,100,180,0.2)", background: "rgba(42,26,85,0.15)", textAlign: "center" }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.25em", color: "#7a6ba8", marginBottom: 8 }}>FOR ENTERTAINMENT PURPOSES ONLY</div>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 13, color: "#6a5a8a", fontStyle: "italic", lineHeight: 1.7, margin: 0 }}>
          Galileo readings are for entertainment and self-reflection only. They are not medical, legal, financial, or crisis advice. All readings are AI-generated. No refunds.
        </p>
      </div>

      <a href="https://jennasys.pro" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#4a3a6a", textDecoration: "none", marginBottom: 40 }}>
        POWERED BY JENNASYS PRO
      </a>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
