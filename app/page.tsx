"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import GalileoCircle from "@/components/GalileoCircle"
import { audioBlobToPCM } from "@/components/FloatingSimli"

type ReadingCard = {
  icon: string; name: string; price: string; color: string; glow: string; border: string
  tagline: string; desc: string; btn: string; href: string; soon?: boolean
}

const SECTIONS: { title: string; subtitle: string; readings: ReadingCard[] }[] = [
  {
    title: "THE CARDS",
    subtitle: "Drawn, shuffled, and read aloud in his voice.",
    readings: [
      {
        icon: "★", name: "Tarot Reading", price: "$15", color: "#c9a84c", glow: "rgba(201,168,76,0.35)", border: "rgba(201,168,76,0.3)",
        tagline: "Any question. A full 78-card deck. Up to 5 exchanges.",
        desc: "Ask what you need to know, and Galileo draws from a fully shuffled tarot deck to speak your reading aloud. Each card is interpreted through your question, your energy, and the story unfolding across the spread.",
        btn: "CHOOSE TAROT", href: "/signup",
      },
      {
        icon: "♠", name: "Cartomancy", price: "$15", color: "#e879a0", glow: "rgba(232,121,160,0.3)", border: "rgba(232,121,160,0.25)",
        tagline: "The old language of playing cards. Direct, sharp, and strangely accurate.",
        desc: "Galileo draws from a shuffled 52-card deck of hearts, spades, diamonds, and clubs. Older in spirit, blunt in tone, and grounded in everyday fate, this reading speaks plainly about the question in front of you.",
        btn: "CHOOSE CARTOMANCY", href: "/signup",
      },
      {
        icon: "◎", name: "Yes or No Oracle", price: "$5", color: "#a5b4fc", glow: "rgba(165,180,252,0.3)", border: "rgba(165,180,252,0.25)",
        tagline: "One question. One clear answer. A short spoken reading.",
        desc: "Ask Galileo a yes or no question and he will consult the sphere for a direct answer — yes, no, perhaps, not yet, or look deeper — with a spoken reading that gives it weight.",
        btn: "CHOOSE YES OR NO", href: "/signup",
      },
    ],
  },
  {
    title: "THE SKY",
    subtitle: "Planetary positions, lunar cycles, and the map of your birth.",
    readings: [
      {
        icon: "☽", name: "Moon Reading", price: "$5", color: "#a5b4fc", glow: "rgba(165,180,252,0.3)", border: "rgba(165,180,252,0.25)",
        tagline: "The current moon phase. The live sky. A message for your season.",
        desc: "Galileo reads the moon as it is right now, blending the current lunar phase with Medicine Wheel wisdom to reflect what this moment is asking of you. Open the reading, and the sky is already set.",
        btn: "CHOOSE MOON", href: "/signup",
      },
      {
        icon: "✦", name: "Natal Chart", price: "$7", color: "#fbbf24", glow: "rgba(251,191,36,0.3)", border: "rgba(251,191,36,0.25)",
        tagline: "Your complete birth chart. Every planet. Every aspect.",
        desc: "Enter your birth date, time, and city. Galileo calculates your real planetary positions and delivers a full natal chart reading — Sun, Moon, Rising, all planets, aspects, and the overarching story of your chart.",
        btn: "CHOOSE NATAL CHART", href: "/signup",
      },
      {
        icon: "☀", name: "Birthday Year Reading", price: "$12", color: "#f97316", glow: "rgba(249,115,22,0.25)", border: "rgba(249,115,22,0.2)",
        tagline: "A reading for the year you are entering.",
        desc: "Using your birthday and the current year, Galileo reflects on the themes, lessons, openings, and challenges surrounding your next personal cycle. Spoken aloud.",
        btn: "CHOOSE YEAR READING", href: "/signup", soon: true,
      },
      {
        icon: "🔢", name: "Name Numerology", price: "$7", color: "#34d399", glow: "rgba(52,211,153,0.25)", border: "rgba(52,211,153,0.2)",
        tagline: "Your name and birth date, read as number and symbol.",
        desc: "Galileo reads the symbolic numbers, patterns, and themes connected to your name and date of birth. A short spoken reading for personality, timing, and life themes.",
        btn: "CHOOSE NUMEROLOGY", href: "/signup", soon: true,
      },
    ],
  },
  {
    title: "THE BODY",
    subtitle: "What the physical carries that the mind doesn't say.",
    readings: [
      {
        icon: "✋", name: "Palm Reading", price: "$5", color: "#c8d4e8", glow: "rgba(200,212,232,0.25)", border: "rgba(200,212,232,0.2)",
        tagline: "Upload your palm. Hear what the lines reveal.",
        desc: "Take a photo of your dominant hand, and Galileo reads the lines, mounts, shape, and symbols. Your reading is spoken aloud in full — a complete palm reading in his old, wise voice.",
        btn: "CHOOSE PALM", href: "/signup",
      },
      {
        icon: "🌈", name: "Aura Photo Reading", price: "$12", color: "#818cf8", glow: "rgba(129,140,248,0.25)", border: "rgba(129,140,248,0.2)",
        tagline: "Upload a photo and receive a symbolic aura reading.",
        desc: "Galileo reads the colors, mood, expression, atmosphere, and emotional impression of the image as a creative reflection. Spoken aloud in his old, wise voice.",
        btn: "CHOOSE AURA READING", href: "/signup",
      },
    ],
  },
  {
    title: "THE VEIL",
    subtitle: "What is hidden, approaching, or asking to be seen.",
    readings: [
      {
        icon: "☁", name: "Dream Interpretation", price: "$12", color: "#a5b4fc", glow: "rgba(165,180,252,0.3)", border: "rgba(165,180,252,0.25)",
        tagline: "Tell Galileo your dream. He reads the symbols.",
        desc: "Share the dream — the people, the places, the feeling, what lingered when you woke. Galileo interprets the symbols, emotional themes, and hidden message beneath the dream in his old, wise voice.",
        btn: "CHOOSE DREAM READING", href: "/signup",
      },
      {
        icon: "🕯", name: "Guide Message", price: "$2", color: "#a78bfa", glow: "rgba(167,139,250,0.25)", border: "rgba(167,139,250,0.2)",
        tagline: "No question needed. Receive the message.",
        desc: "If you do not know what to ask, open this reading and let Galileo speak a message for your current moment. A short oracle reading for reflection, grounding, and clarity.",
        btn: "CHOOSE GUIDE MESSAGE", href: "/signup",
      },
      {
        icon: "🔮", name: "Crystal Vision", price: "$15", color: "#7c3aed", glow: "rgba(124,58,237,0.25)", border: "rgba(124,58,237,0.2)",
        tagline: "A clairvoyance-style reading through Galileo's crystal sphere.",
        desc: "Ask your question and Galileo speaks a symbolic vision of what may be hidden, approaching, or asking to be seen. Mystical, atmospheric, and spoken aloud.",
        btn: "CHOOSE CRYSTAL VISION", href: "/signup", soon: true,
      },
      {
        icon: "🜃", name: "Shadow Reading", price: "$15", color: "#6b7280", glow: "rgba(107,114,128,0.2)", border: "rgba(107,114,128,0.15)",
        tagline: "A deeper reading for what you may be avoiding.",
        desc: "Galileo speaks gently, but he does not flatter. This reading reflects on hidden fears, repeating patterns, blocked emotions, and the truth that may be waiting underneath the surface.",
        btn: "CHOOSE SHADOW READING", href: "/signup", soon: true,
      },
      {
        icon: "🖼", name: "Object Reading", price: "$12", color: "#d97706", glow: "rgba(217,119,6,0.2)", border: "rgba(217,119,6,0.15)",
        tagline: "Upload a photo of a meaningful object or heirloom.",
        desc: "Galileo reads the object symbolically — its mood, story, energy, and meaning. A creative psychometry-style reading for crystals, rings, antiques, or anything that carries history. Spoken aloud.",
        btn: "CHOOSE OBJECT READING", href: "/signup", soon: true,
      },
    ],
  },
  {
    title: "THE HEART",
    subtitle: "For love, connection, longing, and the truth beneath relationships.",
    readings: [
      {
        icon: "♡", name: "Love Oracle", price: "$15", color: "#e879a0", glow: "rgba(232,121,160,0.3)", border: "rgba(232,121,160,0.25)",
        tagline: "A spoken reading for love, connection, and the heart.",
        desc: "Ask about a relationship, a person, a pattern, or your own heart. Galileo reads the emotional energy around the situation and speaks what needs to be seen — clearly, gently, and honestly. Up to 5 exchanges.",
        btn: "CHOOSE LOVE ORACLE", href: "/signup",
      },
    ],
  },
]

function ReadingCard({ icon, name, price, color, glow, border, tagline, desc, btn, href, soon }: ReadingCard) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "24px 26px", borderRadius: 12,
        border: `1px solid ${soon ? "rgba(42,26,85,0.6)" : border}`,
        background: soon
          ? "rgba(10,5,32,0.4)"
          : "linear-gradient(135deg, rgba(10,5,32,0.85) 0%, rgba(20,10,50,0.6) 100%)",
        transform: hovered && !soon ? "translateY(-4px)" : "none",
        boxShadow: hovered && !soon ? `0 14px 44px ${glow}, 0 0 0 1px ${border}` : "none",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        position: "relative", overflow: "hidden",
        opacity: soon ? 0.65 : 1,
      }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, width: 100, height: 100, background: `radial-gradient(circle at top right, ${glow.replace(/[\d.]+\)$/, "0.07)")}, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 18, color: soon ? "#4a3870" : color, filter: soon ? "none" : `drop-shadow(0 0 6px ${color})` }}>{icon}</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.12em", color: soon ? "#4a3870" : "#ddd8f0" }}>{name.toUpperCase()}</span>
        {soon ? (
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.15em", color: "#4a3870", marginLeft: "auto", border: "1px solid rgba(42,26,85,0.8)", borderRadius: 4, padding: "2px 8px" }}>COMING SOON</span>
        ) : (
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.1em", color, marginLeft: "auto", background: glow.replace(/[\d.]+\)$/, "0.1)"), border: `1px solid ${border}`, borderRadius: 4, padding: "2px 9px" }}>{price}</span>
        )}
      </div>
      <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: soon ? "#3a2a5a" : "#b0a8d0", fontStyle: "italic", marginBottom: 8, lineHeight: 1.5 }}>{tagline}</p>
      <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: soon ? "#3a2a5a" : "#7a8ba8", lineHeight: 1.7, marginBottom: soon ? 0 : 18 }}>{desc}</p>
      {!soon && (
        <Link href={href} style={{ display: "inline-block", padding: "9px 22px", borderRadius: 6, border: `1px solid ${border}`, background: glow.replace(/[\d.]+\)$/, "0.09)"), color, fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", textDecoration: "none" }}>
          {btn} ✦
        </Link>
      )}
    </div>
  )
}

// Shows pre-recorded video while speaking, then stays as live GalileoCircle
function GalileoWelcome({ speaking, onSendAudio }: { speaking: boolean; onSendAudio: (fn: (pcm: Uint8Array) => void) => void }) {
  const [hasVideo, setHasVideo] = useState(false)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Check if the pre-recorded video exists
    fetch("/galileo-speaking.webm", { method: "HEAD" })
      .then(r => { if (r.ok) setHasVideo(true) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (hasVideo && speaking && videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
      setVideoPlaying(true)
    }
  }, [speaking, hasVideo])

  const size = 300

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* Pre-recorded video layer — shows only while welcome plays */}
      {hasVideo && (
        <video
          ref={videoRef}
          src="/galileo-speaking.webm"
          playsInline
          onEnded={() => setVideoPlaying(false)}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            borderRadius: "50%", objectFit: "cover", objectPosition: "center top",
            opacity: videoPlaying ? 1 : 0,
            transition: "opacity 0.5s ease",
            zIndex: 2,
          }}
        />
      )}
      {/* Live GalileoCircle underneath / after video ends */}
      <GalileoCircle
        state={!hasVideo && speaking ? "speaking" : "idle"}
        size={size}
        showName={false}
        showStars={false}
        onSendAudio={onSendAudio}
      />
    </div>
  )
}

export default function LandingPage() {
  const [speaking, setSpeaking]  = useState(false)
  const simliSendRef   = useRef<((pcm: Uint8Array) => void) | null>(null)
  const welcomePcmRef  = useRef<Uint8Array | null>(null)
  const pendingSendRef = useRef(false)
  const hasSpokenRef   = useRef(false)

  // Pre-convert welcome MP3 → PCM on mount (no gesture needed)
  useEffect(() => {
    fetch("/galileo-welcome.mp3")
      .then(r => r.blob())
      .then(blob => audioBlobToPCM(blob))
      .then(pcm => {
        welcomePcmRef.current = pcm
        if (pendingSendRef.current && simliSendRef.current) {
          simliSendRef.current(pcm)
          pendingSendRef.current = false
        }
      })
      .catch(() => {})
  }, [])

  function handleSendAudio(fn: (pcm: Uint8Array) => void) {
    simliSendRef.current = fn
    if (pendingSendRef.current && welcomePcmRef.current) {
      fn(welcomePcmRef.current)
      pendingSendRef.current = false
    }
  }

  // On first interaction: play MP3 through speakers + send PCM to Simli for mouth sync
  useEffect(() => {
    let fired = false
    const fire = () => {
      if (fired) return; fired = true
      window.removeEventListener("click",      fire)
      window.removeEventListener("touchstart", fire)
      window.removeEventListener("scroll",     fire)

      const sa = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
      sa.volume = 0; sa.play().catch(() => {})

      if (hasSpokenRef.current) return
      hasSpokenRef.current = true
      setSpeaking(true)

      // Speakers
      const audio = new Audio("/galileo-welcome.mp3")
      audio.onended = () => setSpeaking(false)
      audio.onerror = () => setSpeaking(false)
      audio.play().catch(() => setSpeaking(false))

      // Simli lip sync
      if (welcomePcmRef.current && simliSendRef.current) {
        simliSendRef.current(welcomePcmRef.current)
      } else {
        pendingSendRef.current = true
      }
    }

    window.addEventListener("click",      fire, { once: true })
    window.addEventListener("touchstart", fire, { once: true })
    window.addEventListener("scroll",     fire, { once: true })
    return () => {
      window.removeEventListener("click",      fire)
      window.removeEventListener("touchstart", fire)
      window.removeEventListener("scroll",     fire)
    }
  }, []) // eslint-disable-line

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>

      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }}>
      </div>

      {/* ── HERO ── */}
      <div style={{ width: "100%", maxWidth: 760, textAlign: "center", padding: "64px 24px 52px" }}>
        <div style={{ margin: "0 auto 32px" }}>
          <GalileoWelcome speaking={speaking} onSendAudio={handleSendAudio} />
        </div>
        <h1 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: "clamp(44px, 9vw, 88px)", letterSpacing: "0.15em", marginBottom: 8, lineHeight: 1 }} className="text-shimmer">
          GALILEO
        </h1>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.5em", color: "#9a8ab8", marginBottom: 32 }}>
          THE CELESTIAL ORACLE
        </div>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(22px, 5vw, 32px)", lineHeight: 1.7, color: "#ddd8f0", fontStyle: "italic", maxWidth: 540, margin: "0 auto 18px" }}>
          Bring him what you're carrying. He has been waiting.
        </p>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(15px, 3vw, 17px)", color: "#8878a8", lineHeight: 1.75, maxWidth: 460, margin: "0 auto 44px" }}>
          Every reading is a real conversation — spoken aloud in his voice, remembered across every visit.
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <Link href="/signup" style={{ padding: "20px 64px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.7)", background: "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(79,70,229,0.18))", color: "#f0cc6e", fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: "0.28em", textDecoration: "none", display: "inline-block", boxShadow: "0 0 60px rgba(201,168,76,0.12), 0 4px 24px rgba(0,0,0,0.5)" }}>
            START MY READING ✦
          </Link>
          <Link href="/login" style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#6a5a8a", textDecoration: "none", fontStyle: "italic" }}>
            I have been here before
          </Link>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: "100%", maxWidth: 480, height: 1, background: "linear-gradient(to right, transparent, rgba(79,70,229,0.5), transparent)", marginBottom: 72 }} />

      {/* ── READINGS — 5 SECTIONS ── */}
      <div style={{ width: "100%", maxWidth: 720, padding: "0 20px", marginBottom: 80 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.4em", color: "#9a8ab8", textAlign: "center", marginBottom: 12 }}>
          CHOOSE YOUR READING
        </div>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#4a3870", textAlign: "center", marginBottom: 56, fontStyle: "italic" }}>
          Full readings include spoken Galileo responses and follow-up exchanges where included. Mini readings are shorter, focused sessions.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
          {SECTIONS.map(({ title, subtitle, readings }) => (
            <div key={title}>
              <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid rgba(42,26,85,0.5)" }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: "0.3em", color: "#c9a84c", marginBottom: 4 }}>{title}</div>
                <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#6a5a8a", fontStyle: "italic" }}>{subtitle}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {readings.map(r => <ReadingCard key={r.name} {...r} />)}
              </div>
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
            "Choose your reading from the list above",
            "Create an account and complete your payment",
            "Ask your question, share your dream, or upload your photo",
            "Galileo speaks your answer aloud, in his own voice",
            "Continue the conversation until your session is complete",
          ].map((text, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16, textAlign: "left", padding: "16px 0", borderBottom: i < 4 ? "1px solid rgba(42,26,85,0.4)" : "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.35)", background: "rgba(201,168,76,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'Cinzel', serif", fontSize: 10, color: "#c9a84c", marginTop: 2 }}>{i + 1}</div>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: "#c8d4e8", lineHeight: 1.65, margin: 0 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div style={{ width: "100%", maxWidth: 600, padding: "40px 24px", marginBottom: 64, borderRadius: 16, border: "1px solid rgba(201,168,76,0.2)", background: "linear-gradient(135deg, rgba(20,10,50,0.8), rgba(10,5,32,0.9))", textAlign: "center", boxShadow: "0 0 80px rgba(79,70,229,0.1)" }}>
        <div style={{ fontSize: 32, marginBottom: 16, filter: "drop-shadow(0 0 12px rgba(201,168,76,0.4))" }}>☽</div>
        <h2 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: "clamp(18px, 4vw, 26px)", letterSpacing: "0.12em", marginBottom: 12 }} className="text-shimmer">HE IS WAITING</h2>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: "#8878a8", fontStyle: "italic", lineHeight: 1.7, marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>
          Galileo remembers every reading. The longer you come, the more precisely he sees you.
        </p>
        <Link href="/signup" style={{ padding: "18px 56px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.6)", background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(79,70,229,0.15))", color: "#f0cc6e", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.25em", textDecoration: "none", display: "inline-block", boxShadow: "0 0 40px rgba(201,168,76,0.1)" }}>
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
      <div style={{ maxWidth: 560, padding: "20px 28px", marginBottom: 20, borderRadius: 8, border: "1px solid rgba(120,100,180,0.2)", background: "rgba(42,26,85,0.15)", textAlign: "center" }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.25em", color: "#7a6ba8", marginBottom: 10 }}>FOR REFLECTION AND ENTERTAINMENT</div>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#6a5a8a", fontStyle: "italic", lineHeight: 1.75, margin: 0 }}>
          Galileo readings are offered for reflection, creativity, and entertainment. They are not medical, legal, financial, or crisis advice. If you are in immediate danger or need professional support, please contact the appropriate professional or emergency service.
        </p>
      </div>

      <a href="https://jennasys.pro" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#4a3a6a", textDecoration: "none", marginBottom: 40 }}>
        POWERED BY JENNASYS PRO
      </a>

    </div>
  )
}
