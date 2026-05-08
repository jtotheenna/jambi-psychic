"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

export default function LandingPage() {
  const [playing, setPlaying] = useState(false)
  const [glowing, setGlowing] = useState(false)
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
      setPlaying(false)
      setGlowing(false)
    } else {
      audioRef.current.play().catch(() => {})
      setPlaying(true)
      setGlowing(true)
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>

      {/* ── HERO ── */}
      <div style={{ width: "100%", maxWidth: 720, textAlign: "center", padding: "52px 20px 40px" }}>

        {/* Portrait */}
        <div style={{ position: "relative", width: 180, height: 180, margin: "0 auto 32px", borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(201,168,76,0.4)", boxShadow: glowing ? "0 0 60px rgba(201,168,76,0.5), 0 0 120px rgba(165,180,252,0.3)" : "0 0 30px rgba(201,168,76,0.15)", transition: "box-shadow 0.6s ease" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/galileo.jpg" alt="Galileo" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", filter: glowing ? "brightness(1.1)" : "brightness(1)", transition: "filter 0.6s ease" }} />
          {glowing && (
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, transparent 60%, rgba(201,168,76,0.15) 100%)", animation: "moonPulse 1.2s ease-in-out infinite" }} />
          )}
        </div>

        <h1 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: "clamp(40px, 8vw, 80px)", letterSpacing: "0.15em", marginBottom: 10, lineHeight: 1.1 }} className="text-shimmer">
          GALILEO
        </h1>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.4em", color: "#7a6ba8", marginBottom: 28 }}>
          THE CELESTIAL ORACLE
        </div>

        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(17px, 4vw, 21px)", lineHeight: 1.85, color: "#c8d4e8", fontStyle: "italic", marginBottom: 12, maxWidth: 520, margin: "0 auto 12px" }}>
          A talking AI oracle who reads tarot, your palm, and the live moon — then speaks your answer aloud in his old, wise voice.
        </p>

        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(14px, 3vw, 16px)", color: "#7a8ba8", lineHeight: 1.7, marginBottom: 36, maxWidth: 460, margin: "0 auto 36px" }}>
          Welcome, seeker. Choose your reading, ask your question, and Galileo will speak your answer aloud.
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <Link href="/signup" style={{ padding: "18px 56px", borderRadius: 6, border: "1px solid rgba(201,168,76,0.6)", background: "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(79,70,229,0.12) 100%)", color: "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.25em", textDecoration: "none", display: "inline-block", boxShadow: "0 0 40px rgba(201,168,76,0.08)" }}>
            START MY READING ✦
          </Link>

          <button
            onClick={hearGalileo}
            style={{ padding: "12px 32px", borderRadius: 6, border: `1px solid ${playing ? "rgba(165,180,252,0.6)" : "rgba(165,180,252,0.25)"}`, background: playing ? "rgba(79,70,229,0.15)" : "transparent", color: playing ? "#a5b4fc" : "#7a8ba8", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.2em", cursor: "pointer", transition: "all 0.3s ease", display: "flex", alignItems: "center", gap: 8 }}
          >
            <span style={{ fontSize: 14 }}>{playing ? "◼" : "▶"}</span>
            {playing ? "GALILEO IS SPEAKING..." : "HEAR GALILEO FIRST"}
          </button>

          <Link href="/login" style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#7a6ba8", textDecoration: "none", fontStyle: "italic" }}>
            I have been here before
          </Link>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: "100%", maxWidth: 480, height: 1, background: "linear-gradient(to right, transparent, rgba(42,26,85,0.8), transparent)", margin: "48px 0" }} />

      {/* ── READINGS ── */}
      <div style={{ width: "100%", maxWidth: 680, padding: "0 20px", marginBottom: 72 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.35em", color: "#7a6ba8", textAlign: "center", marginBottom: 32 }}>
          THE READINGS
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              icon: "★", name: "Tarot Reading", price: "$10", color: "#c9a84c", border: "rgba(201,168,76,0.25)",
              tagline: "Any question. A full 78-card deck. Up to 10 exchanges.",
              desc: "Ask what you need to know, and Galileo will draw from a fully shuffled tarot deck to speak your reading aloud. Each card is interpreted through your question, your energy, and the story unfolding across the spread.",
              href: "/signup", btn: "CHOOSE TAROT",
            },
            {
              icon: "☽", name: "Moon Reading", price: "$5", color: "#a5b4fc", border: "rgba(165,180,252,0.2)",
              tagline: "The current moon phase. The live sky. A message for your season.",
              desc: "Galileo reads the moon as it is right now, blending the current lunar phase with Medicine Wheel wisdom to reflect what this moment is asking of you. Open the reading, and the sky is already set.",
              href: "/signup", btn: "CHOOSE MOON",
            },
            {
              icon: "✋", name: "Palm Reading", price: "$5", color: "#c8d4e8", border: "rgba(200,212,232,0.15)",
              tagline: "Upload your palm. Hear what the lines reveal.",
              desc: "Take a photo of your dominant hand, and Galileo will read the lines, mounts, shape, and symbols of your palm. Your reading is spoken aloud, with room to ask follow-up questions and go deeper.",
              href: "/signup", btn: "CHOOSE PALM",
            },
            {
              icon: "♠", name: "Cartomancy", price: "$10", color: "#e879a0", border: "rgba(232,121,160,0.2)",
              tagline: "The old language of playing cards. Direct, sharp, and strangely accurate.",
              desc: "Galileo draws from a shuffled 52-card deck of hearts, spades, diamonds, and clubs. Older in spirit, blunt in tone, and grounded in everyday fate, this reading speaks plainly about the question in front of you.",
              href: "/signup", btn: "CHOOSE CARTOMANCY",
            },
          ].map(({ icon, name, price, color, border, tagline, desc, href, btn }) => (
            <div
              key={name}
              style={{ padding: "24px", borderRadius: 10, border: `1px solid ${border}`, background: "rgba(10,5,32,0.5)", transition: "transform 0.18s ease, box-shadow 0.18s ease", cursor: "pointer" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px) scale(1.01)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px ${color}30, 0 0 0 1px ${color}60` }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none" }}
              onTouchStart={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px) scale(1.01)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px ${color}30, 0 0 0 1px ${color}60` }}
              onTouchEnd={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 18, color }}>{icon}</span>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.15em", color: "#c8d4e8" }}>{name.toUpperCase()}</span>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.15em", color, marginLeft: "auto" }}>{price}</span>
              </div>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#a5b4fc", fontStyle: "italic", marginBottom: 6, lineHeight: 1.5 }}>{tagline}</p>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#7a8ba8", lineHeight: 1.7, marginBottom: 16 }}>{desc}</p>
              <Link href={href} style={{ display: "inline-block", padding: "8px 22px", borderRadius: 6, border: `1px solid ${border}`, color, fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.18em", textDecoration: "none" }}>
                {btn} ✦
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: "100%", maxWidth: 480, height: 1, background: "linear-gradient(to right, transparent, rgba(42,26,85,0.8), transparent)", marginBottom: 64 }} />

      {/* ── HOW IT WORKS ── */}
      <div style={{ width: "100%", maxWidth: 560, padding: "0 20px", marginBottom: 72, textAlign: "center" }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.35em", color: "#7a6ba8", marginBottom: 32 }}>
          HOW IT WORKS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            ["1", "Choose your reading"],
            ["2", "Ask your question"],
            ["3", "Pull the cards, read the moon, or upload your palm"],
            ["4", "Galileo speaks your answer aloud"],
            ["5", "Continue the reading until the session is complete"],
          ].map(([num, text]) => (
            <div key={num} style={{ display: "flex", alignItems: "center", gap: 16, textAlign: "left" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'Cinzel', serif", fontSize: 10, color: "#c9a84c" }}>{num}</div>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: "#c8d4e8", lineHeight: 1.6 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: "100%", maxWidth: 480, height: 1, background: "linear-gradient(to right, transparent, rgba(42,26,85,0.8), transparent)", marginBottom: 64 }} />

      {/* ── HE REMEMBERS ── */}
      <div style={{ maxWidth: 560, padding: "0 20px", textAlign: "center", marginBottom: 64 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.35em", color: "#7a6ba8", marginBottom: 20 }}>HE REMEMBERS YOU</div>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(16px, 4vw, 19px)", color: "#8878a8", lineHeight: 1.9, fontStyle: "italic" }}>
          Galileo tracks recurring themes across every reading. The second time you come, he knows you've been before. The fifth time, he references patterns you may not have noticed yourself.
        </p>
      </div>

      {/* Quote */}
      <div style={{ maxWidth: 480, padding: "0 32px", textAlign: "center", marginBottom: 56 }}>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: "#7a6ba8", fontStyle: "italic", lineHeight: 1.8 }}>
          "The stars don't lie. They do, however, occasionally withhold."
        </p>
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#6a5a8a", marginTop: 8 }}>— GALILEO</p>
      </div>

      {/* Disclaimer */}
      <div style={{ maxWidth: 520, padding: "16px 24px", marginBottom: 20, borderRadius: 8, border: "1px solid rgba(120,100,180,0.25)", background: "rgba(42,26,85,0.2)", textAlign: "center" }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.25em", color: "#9a8ab8", marginBottom: 8 }}>FOR ENTERTAINMENT PURPOSES ONLY</div>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#8a7aa8", fontStyle: "italic", lineHeight: 1.7, margin: 0 }}>
          Galileo readings are for entertainment and self-reflection only. They are not medical, legal, financial, or crisis advice. All readings are AI-generated. No refunds.
        </p>
      </div>

      <a href="https://jennasys.pro" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#6a5a8a", textDecoration: "none", marginBottom: 40 }}>
        POWERED BY JENNASYS PRO
      </a>
    </div>
  )
}
