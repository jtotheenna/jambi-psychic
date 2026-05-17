"use client"

import Link from "next/link"
import { useRef, useState, useEffect } from "react"
import GalileoCircle from "@/components/GalileoCircle"

// ── Reading data ──────────────────────────────────────────────────────────────

type ReadingCard = {
  icon: string; name: string; price: string; color: string
  glow: string; border: string; tagline: string; desc: string; href: string
  guestHref?: string | null
}

const SECTIONS: { title: string; subtitle: string; readings: ReadingCard[] }[] = [
  {
    title: "THE CARDS",
    subtitle: "Drawn, shuffled, and spoken aloud.",
    readings: [
      {
        icon: "★", name: "Tarot Reading", price: "$15", color: "#c9a84c",
        glow: "rgba(201,168,76,0.35)", border: "rgba(201,168,76,0.3)",
        tagline: "Any question. A full 78-card deck. Up to 5 exchanges.",
        desc: "Galileo draws from a fully shuffled 78-card tarot deck. Every card is read by name — its imagery, its position, what it says about your situation right now. Rich, specific, spoken aloud.",
        href: "/signup",
      },
      {
        icon: "♠", name: "Cartomancy", price: "$15", color: "#e879a0",
        glow: "rgba(232,121,160,0.3)", border: "rgba(232,121,160,0.25)",
        tagline: "The old language of playing cards. Direct, sharp, exact.",
        desc: "Galileo reads from a shuffled 52-card deck of hearts, spades, diamonds, and clubs. Older in spirit, blunter in tone. The playing cards do not soften.",
        href: "/signup",
      },
      {
        icon: "◎", name: "Yes or No Oracle", price: "$5", color: "#a5b4fc",
        glow: "rgba(165,180,252,0.3)", border: "rgba(165,180,252,0.25)",
        tagline: "One question. One clear answer. Spoken with weight.",
        desc: "Ask a yes or no question. Galileo consults the sphere and returns yes, no, perhaps, not yet, or look deeper — with a short spoken reading that gives the answer its full meaning.",
        href: "/signup",
      },
    ],
  },
  {
    title: "THE SKY",
    subtitle: "The moon, the planets, and the map written at your birth.",
    readings: [
      {
        icon: "☽", name: "Moon Reading", price: "$7", color: "#a5b4fc",
        glow: "rgba(165,180,252,0.3)", border: "rgba(165,180,252,0.25)",
        tagline: "The live moon phase. A message for your current season.",
        desc: "Galileo reads the moon exactly as it is tonight. The current lunar phase blended with Medicine Wheel wisdom — what this moment is asking of you. Open the reading and the sky is already set.",
        href: "/signup",
      },
      {
        icon: "✦", name: "Natal Chart Reading", price: "$7", color: "#fbbf24",
        glow: "rgba(251,191,36,0.3)", border: "rgba(251,191,36,0.25)",
        tagline: "Every planet. Every house. Every aspect. Your complete chart.",
        desc: "Enter your birth date, time, and city. Galileo calculates your real planetary positions and delivers a complete natal chart reading — Sun, Moon, Rising, all planets, aspects, and the story of your life written in the sky.",
        href: "/signup",
      },
    ],
  },
  {
    title: "THE BODY",
    subtitle: "What the physical carries that the mind doesn't say.",
    readings: [
      {
        icon: "✋", name: "Palm Reading", price: "$7", color: "#c8d4e8",
        glow: "rgba(200,212,232,0.25)", border: "rgba(200,212,232,0.2)",
        tagline: "Upload your palm. Hear what the lines carry.",
        desc: "Take a photo of your dominant hand. Galileo reads the lines, mounts, shape, and markings of your palm in full — several paragraphs, spoken aloud in his old, wise voice.",
        href: "/signup",
      },
      {
        icon: "🌈", name: "Aura Photo Reading", price: "$7", color: "#818cf8",
        glow: "rgba(129,140,248,0.25)", border: "rgba(129,140,248,0.2)",
        tagline: "Upload a photo. Receive a symbolic aura reading.",
        desc: "Galileo reads the actual colors detected in your photograph as a creative aura field — their meanings, their energy, and what they say about you right now. Spoken aloud.",
        href: "/signup",
      },
    ],
  },
  {
    title: "THE VEIL",
    subtitle: "What is hidden, approaching, or asking to be seen.",
    readings: [
      {
        icon: "☁", name: "Dream Interpretation", price: "$7", color: "#a5b4fc",
        glow: "rgba(165,180,252,0.3)", border: "rgba(165,180,252,0.25)",
        tagline: "Tell Galileo your dream. He reads what it carries.",
        desc: "Describe the dream — the people, the places, the feeling, what stayed with you when you woke. Galileo reads the symbols, the emotional themes, and the hidden message beneath. Spoken aloud.",
        href: "/signup",
      },
      {
        icon: "🕯", name: "Guide Message", price: "$5", color: "#a78bfa",
        glow: "rgba(167,139,250,0.25)", border: "rgba(167,139,250,0.2)",
        tagline: "No question needed. Receive the message.",
        desc: "If you do not know what to ask, open this reading and let Galileo speak a message for your current moment. A short oracle reading for reflection, grounding, and clarity.",
        href: "/signup",
      },
    ],
  },
  {
    title: "THE HEART",
    subtitle: "For love, connection, longing, and what the heart already knows.",
    readings: [
      {
        icon: "♡", name: "Love Oracle", price: "$15", color: "#e879a0",
        glow: "rgba(232,121,160,0.3)", border: "rgba(232,121,160,0.25)",
        tagline: "A spoken reading for love, connection, and the truth beneath.",
        desc: "Ask about a relationship, a person, a pattern, or your own heart. Galileo reads the emotional energy around the situation and speaks what needs to be seen — clearly, gently, and honestly. Up to 5 exchanges.",
        href: "/signup",
      },
    ],
  },
]

function ReadingCard({ icon, name, price, color, glow, border, tagline, desc, href, guestHref }: ReadingCard) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "24px 26px", borderRadius: 12,
        border: `1px solid ${border}`,
        background: "linear-gradient(135deg, rgba(10,5,32,0.85) 0%, rgba(20,10,50,0.6) 100%)",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? `0 14px 44px ${glow}, 0 0 0 1px ${border}` : "none",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, width: 100, height: 100, background: `radial-gradient(circle at top right, ${glow.replace(/[\d.]+\)$/, "0.07)")}, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 18, color, filter: `drop-shadow(0 0 6px ${color})` }}>{icon}</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.12em", color: "#ddd8f0" }}>{name.toUpperCase()}</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.1em", color, marginLeft: "auto", background: glow.replace(/[\d.]+\)$/, "0.1)"), border: `1px solid ${border}`, borderRadius: 4, padding: "2px 9px" }}>{price}</span>
      </div>
      <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#b0a8d0", fontStyle: "italic", marginBottom: 8, lineHeight: 1.5 }}>{tagline}</p>
      <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#7a8ba8", lineHeight: 1.7, marginBottom: 18 }}>{desc}</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {guestHref && (
          <a href={guestHref} style={{ display: "inline-block", padding: "10px 24px", borderRadius: 6, border: `1px solid ${border}`, background: glow.replace(/[\d.]+\)$/, "0.15)"), color, fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", textDecoration: "none", fontWeight: 600 }}>
            GET READING ✦
          </a>
        )}
        <Link href={href} style={{ display: "inline-block", padding: "9px 18px", borderRadius: 6, border: "1px solid rgba(42,26,85,0.6)", background: "transparent", color: "#6a5a8a", fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.15em", textDecoration: "none" }}>
          {guestHref ? "SIGN IN FIRST" : `CHOOSE ${name.toUpperCase()} ✦`}
        </Link>
      </div>
    </div>
  )
}

// ── Landing page ──────────────────────────────────────────────────────────────

export default function LandingPage({ guestLinks = {} }: { guestLinks?: Record<string, string | null> }) {
  const [speaking, setSpeaking] = useState(false)
  const [sampleSpeaking, setSampleSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sampleRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const device = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "/visit-mobile" : "/visit-desktop"
    fetch("/api/pageview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "/" }) }).catch(() => {})
    fetch("/api/pageview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: device }) }).catch(() => {})
    if (typeof window !== "undefined" && (window as any).ttq) {
      ;(window as any).ttq.track("ViewContent", { contents: [{ content_id: "landing", content_type: "product", content_name: "Galileo Oracle" }], value: 5, currency: "USD" })
    }
    if (typeof window !== "undefined") {
      const a = new Audio("/galileo-welcome.mp3")
      a.preload = "auto"
      a.onended = () => setSpeaking(false)
      a.onerror = () => setSpeaking(false)
      audioRef.current = a

      const s = new Audio("/galileo-sample.mp3")
      s.preload = "auto"
      s.onended = () => setSampleSpeaking(false)
      s.onerror = () => setSampleSpeaking(false)
      sampleRef.current = s
    }
  }, [])

  function trackEvent(name: string) {
    fetch("/api/pageview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: name }) }).catch(() => {})
  }

  function trackCTA() {
    if (typeof window === "undefined" || !(window as any).ttq) return
    const contents = [{ content_id: "yes-no", content_type: "product", content_name: "Yes or No Oracle" }]
    ;(window as any).ttq.track("AddToCart", { contents, value: 5, currency: "USD" })
    ;(window as any).ttq.track("InitiateCheckout", { contents, value: 5, currency: "USD" })
  }

  function playSample() {
    if (sampleSpeaking) return
    trackEvent("/hear-sample")
    setSampleSpeaking(true)
    if (sampleRef.current) {
      sampleRef.current.currentTime = 0
      sampleRef.current.play().catch(() => setSampleSpeaking(false))
    }
  }

  function hearGalileo() {
    if (speaking) return
    trackEvent("/hear-galileo")
    // Safari audio unlock
    const sa = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    sa.volume = 0; sa.play().catch(() => {})
    setSpeaking(true)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => setSpeaking(false))
    } else {
      setSpeaking(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>

      {/* ── HERO ── */}
      <div style={{ width: "100%", maxWidth: 620, textAlign: "center", padding: "clamp(28px, 6vw, 56px) 20px clamp(24px, 5vw, 48px)", display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Live circle + sample button right under */}
        <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <GalileoCircle state={sampleSpeaking ? "speaking" : speaking ? "speaking" : "idle"} size={220} showName={false} showStars={false} />
          <button
            onClick={playSample}
            disabled={sampleSpeaking}
            style={{
              padding: "12px 36px", borderRadius: 8, cursor: sampleSpeaking ? "default" : "pointer",
              border: `1px solid ${sampleSpeaking ? "rgba(201,168,76,0.7)" : "rgba(201,168,76,0.4)"}`,
              background: sampleSpeaking ? "rgba(201,168,76,0.15)" : "rgba(201,168,76,0.07)",
              color: sampleSpeaking ? "#f0cc6e" : "#c9a84c",
              fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.22em",
              transition: "all 0.25s ease",
              boxShadow: sampleSpeaking ? "0 0 32px rgba(201,168,76,0.2)" : "none",
            }}
          >
            {sampleSpeaking ? "GALILEO IS SPEAKING…" : "HEAR HIS VOICE ✦"}
          </button>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: "clamp(44px, 9vw, 84px)", letterSpacing: "0.15em", marginBottom: 8, lineHeight: 1, color: "#f0cc6e" }}>GALILEO</h1>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.5em", color: "#9a8ab8", marginBottom: 24 }}>THE CELESTIAL ORACLE</div>

        {/* Hook */}
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(20px, 5vw, 28px)", lineHeight: 1.65, color: "#ddd8f0", fontStyle: "italic", maxWidth: 480, margin: "0 auto 10px" }}>
          Ask him what you cannot stop thinking about.
        </p>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(15px, 3vw, 18px)", color: "#8878a8", lineHeight: 1.7, maxWidth: 400, margin: "0 auto 28px" }}>
          He answers out loud, in his own voice. Start with one question for $5.
        </p>

        {/* Primary CTA */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 24 }}>
          {guestLinks["yes-no"] ? (
            <a href={guestLinks["yes-no"]} onClick={trackCTA} style={{ padding: "18px 0", borderRadius: 8, border: "1px solid rgba(201,168,76,0.7)", background: "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(79,70,229,0.18))", color: "#f0cc6e", fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: "0.25em", textDecoration: "none", display: "block", width: "100%", maxWidth: 340, boxShadow: "0 0 60px rgba(201,168,76,0.12), 0 4px 24px rgba(0,0,0,0.5)" }}>
              ASK A $5 QUESTION ✦
            </a>
          ) : (
            <Link href="/signup" style={{ padding: "18px 0", borderRadius: 8, border: "1px solid rgba(201,168,76,0.7)", background: "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(79,70,229,0.18))", color: "#f0cc6e", fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: "0.25em", textDecoration: "none", display: "block", width: "100%", maxWidth: 340 }}>
              ASK A $5 QUESTION ✦
            </Link>
          )}
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#4a3870", fontStyle: "italic", margin: 0 }}>
            No app. No subscription. Just ask and listen.
          </p>
        </div>

        {/* Sample questions */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 480, marginBottom: 24 }}>
          {["What am I not seeing?", "Should I let this go?", "What is the energy around this person?", "What do I need to hear tonight?"].map(q => (
            <div key={q} style={{ padding: "7px 14px", borderRadius: 20, border: "1px solid rgba(42,26,85,0.6)", background: "rgba(10,5,32,0.4)", fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#6a5a8a", fontStyle: "italic" }}>{q}</div>
          ))}
        </div>

        <Link href="/login" style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.2em", color: "#8878a8", textDecoration: "none", padding: "12px 0", borderRadius: 6, border: "1px solid rgba(42,26,85,0.6)", background: "rgba(10,5,32,0.4)", display: "block", width: "100%", maxWidth: 340, textAlign: "center" }}>
          I HAVE BEEN HERE BEFORE ✦
        </Link>
      </div>

      {/* Divider */}
      <div style={{ width: "100%", maxWidth: 480, height: 1, background: "linear-gradient(to right, transparent, rgba(79,70,229,0.5), transparent)", marginBottom: 64 }} />

      {/* ── READINGS ── */}
      <div style={{ width: "100%", maxWidth: 720, padding: "0 20px", marginBottom: 80 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.4em", color: "#9a8ab8", textAlign: "center", marginBottom: 10 }}>
          CHOOSE YOUR READING
        </div>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#4a3870", textAlign: "center", marginBottom: 56, fontStyle: "italic" }}>
          Full readings include spoken responses and follow-up exchanges where included.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 52 }}>
          {SECTIONS.map(({ title, subtitle, readings }) => (
            <div key={title}>
              <div style={{ marginBottom: 18, paddingBottom: 12, borderBottom: "1px solid rgba(42,26,85,0.5)" }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: "0.3em", color: "#c9a84c", marginBottom: 3 }}>{title}</div>
                <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#6a5a8a", fontStyle: "italic" }}>{subtitle}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {readings.map(r => {
                  const typeKey = r.name === "Natal Chart Reading" ? "astrology"
                    : r.name === "Yes or No Oracle" ? "yes-no"
                    : r.name === "Love Oracle" ? "love"
                    : r.name === "Guide Message" ? "guide"
                    : r.name.toLowerCase().split(" ")[0]
                  return <ReadingCard key={r.name} {...r} guestHref={guestLinks[typeKey] ?? null} />
                })}
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
            ["Choose your reading", "Select tarot, cartomancy, moon, palm, dream, love, or another oracle path."],
            ["Checkout securely", "Complete your payment through secure checkout. Readings are available immediately."],
            ["Ask your question", "Tell Galileo what you are carrying, wondering, or trying to understand."],
            ["Receive your spoken reading", "Galileo reads the symbols and speaks your message aloud in his old, wise voice."],
            ["Continue the exchange", "For readings that include follow-up exchanges, you can go deeper with Galileo after the first message."],
          ].map(([title, text], i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16, textAlign: "left", padding: "18px 0", borderBottom: i < 4 ? "1px solid rgba(42,26,85,0.4)" : "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.35)", background: "rgba(201,168,76,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'Cinzel', serif", fontSize: 10, color: "#c9a84c", marginTop: 2 }}>{i + 1}</div>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em", color: "#c9a84c", marginBottom: 4 }}>{title.toUpperCase()}</div>
                <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: "#c8d4e8", lineHeight: 1.65, margin: 0 }}>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: "100%", maxWidth: 480, height: 1, background: "linear-gradient(to right, transparent, rgba(79,70,229,0.5), transparent)", marginBottom: 64 }} />

      {/* ── TESTIMONIALS ── */}
      <div style={{ width: "100%", maxWidth: 680, padding: "0 24px", marginBottom: 80 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.4em", color: "#9a8ab8", textAlign: "center", marginBottom: 48 }}>WHAT PEOPLE ARE SAYING</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            {
              quote: "I asked about a job I'd been going back and forth on for weeks. He named the exact fear I hadn't said out loud. I accepted the offer the next day.",
              name: "Marisa T.",
              reading: "Tarot Reading",
              color: "#c9a84c",
            },
            {
              quote: "The palm reading was genuinely uncanny. He described my relationship with my mother from a photo of my hand. I don't know how.",
              name: "Devon K.",
              reading: "Palm Reading",
              color: "#c8d4e8",
            },
            {
              quote: "I asked a yes or no question I'd been too scared to ask anyone. He said 'not yet — and here is why.' That answer changed how I moved through the next month.",
              name: "Rae S.",
              reading: "Yes or No Oracle",
              color: "#a5b4fc",
            },
          ].map(({ quote, name, reading, color }, i) => (
            <div key={i} style={{ padding: "28px 32px", borderRadius: 12, border: "1px solid rgba(42,26,85,0.6)", background: "linear-gradient(135deg, rgba(10,5,32,0.8), rgba(20,10,50,0.5))", position: "relative" }}>
              <div style={{ position: "absolute", top: 20, left: 26, fontFamily: "'EB Garamond', serif", fontSize: 48, color: "rgba(201,168,76,0.12)", lineHeight: 1, userSelect: "none" }}>"</div>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 19, color: "#ddd8f0", fontStyle: "italic", lineHeight: 1.75, margin: "0 0 20px", paddingLeft: 8 }}>
                "{quote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 1, height: 28, background: `linear-gradient(to bottom, ${color}, transparent)` }} />
                <div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em", color: "#ddd8f0" }}>{name}</div>
                  <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 13, color, marginTop: 2 }}>{reading}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div style={{ width: "100%", maxWidth: 600, padding: "40px 24px", marginBottom: 64, borderRadius: 16, border: "1px solid rgba(201,168,76,0.2)", background: "linear-gradient(135deg, rgba(20,10,50,0.8), rgba(10,5,32,0.9))", textAlign: "center", boxShadow: "0 0 80px rgba(79,70,229,0.1)" }}>
        <div style={{ fontSize: 32, marginBottom: 16, filter: "drop-shadow(0 0 12px rgba(201,168,76,0.4))" }}>☽</div>
        <h2 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: "clamp(18px, 4vw, 26px)", letterSpacing: "0.12em", marginBottom: 12 }} className="text-shimmer">HE IS WAITING</h2>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: "#8878a8", fontStyle: "italic", lineHeight: 1.7, maxWidth: 400, margin: "0 auto 28px" }}>
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
          Galileo readings are for reflection, creativity, and entertainment. They are not medical, legal, financial, or crisis advice. If you are in immediate danger or need professional support, please contact the appropriate professional or emergency service.
        </p>
      </div>

      <a href="https://jennasys.pro" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#4a3a6a", textDecoration: "none", marginBottom: 40 }}>
        POWERED BY JENNASYS PRO
      </a>

    </div>
  )
}
