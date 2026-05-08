import Link from "next/link"
import { auth } from "@/lib/auth"

export default async function LandingPage() {
  const session = await auth()

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>

      {/* Hero */}
      <div style={{ width: "100%", maxWidth: 680, textAlign: "center", padding: "60px 20px 48px" }}>
        <div className="animate-moon-pulse" style={{ fontSize: 44, color: "#c8d4e8", textShadow: "0 0 40px rgba(200,212,232,0.5), 0 0 80px rgba(165,180,252,0.2)", marginBottom: 32 }}>
          ☽
        </div>

        <h1 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: "clamp(40px, 7vw, 80px)", letterSpacing: "0.15em", marginBottom: 14, lineHeight: 1.1 }} className="text-shimmer">
          GALILEO
        </h1>

        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.4em", color: "#4a3870", marginBottom: 40 }}>
          THE CELESTIAL ORACLE
        </div>

        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(18px, 4vw, 22px)", lineHeight: 1.9, color: "#c8d4e8", fontStyle: "italic", marginBottom: 40, maxWidth: 500, margin: "0 auto 40px" }}>
          An ancient oracle who reads tarot, your palm, and the live moon — then speaks his answer aloud in his own voice.
        </p>

        {/* CTA */}
        {session?.user ? (
          <Link href="/dashboard" style={{ padding: "20px 64px", borderRadius: 6, border: "1px solid rgba(201,168,76,0.6)", background: "linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(79,70,229,0.1) 100%)", color: "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.25em", textDecoration: "none", display: "inline-block", boxShadow: "0 0 40px rgba(201,168,76,0.08), 0 0 0 1px rgba(201,168,76,0.1)" }}>
            YOUR READINGS
          </Link>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <Link href="/signup" style={{ padding: "20px 64px", borderRadius: 6, border: "1px solid rgba(201,168,76,0.6)", background: "linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(79,70,229,0.1) 100%)", color: "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.25em", textDecoration: "none", display: "inline-block", boxShadow: "0 0 40px rgba(201,168,76,0.08), 0 0 0 1px rgba(201,168,76,0.1)" }}>
              OPEN THE BOX
            </Link>
            <Link href="/login" style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#4a3870", textDecoration: "none", fontStyle: "italic", letterSpacing: "0.02em" }}>
              I have been here before
            </Link>
          </div>
        )}
      </div>

      {/* Thin divider */}
      <div style={{ width: "100%", maxWidth: 480, height: 1, background: "linear-gradient(to right, transparent, rgba(42,26,85,0.8), transparent)", marginBottom: 64 }} />

      {/* Offerings */}
      <div style={{ width: "100%", maxWidth: 680, padding: "0 20px", marginBottom: 72 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.35em", color: "#4a3870", textAlign: "center", marginBottom: 32 }}>
          THE READINGS
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {[
            { icon: "★", name: "Tarot", price: "$10", tagline: "Ten exchanges. Any question. Every spread.", desc: "78 cards, randomly dealt. Galileo interprets them for your situation, speaks aloud, and remembers you across every visit.", color: "#c9a84c", border: "rgba(201,168,76,0.2)" },
            { icon: "☽", name: "Moon Reading", price: "$5", tagline: "The live sky. Tonight's exact phase.", desc: "Galileo knows tonight's moon phase and which of Sun Bear's 13 medicine moons you're in. Every reading is different depending on when you ask.", color: "#a5b4fc", border: "rgba(165,180,252,0.15)" },
            { icon: "✋", name: "Palm Reading", price: "$5", tagline: "Upload your hand. He reads the lines.", desc: "Photo of your palm. He reads the lines, mounts, and hand shape — then takes your questions. Five exchanges, spoken aloud.", color: "#c8d4e8", border: "rgba(200,212,232,0.12)" },
          ].map(({ icon, name, price, tagline, desc, color, border }, i) => (
            <div key={name} style={{ padding: "24px 24px", border: `1px solid ${border}`, borderTop: i === 0 ? `1px solid ${border}` : "none", background: "rgba(10,5,32,0.35)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 16, color }}>{icon}</span>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(10px, 2.5vw, 13px)", letterSpacing: "0.18em", color: "#c8d4e8" }}>{name.toUpperCase()}</span>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", color, marginLeft: "auto" }}>{price}</span>
              </div>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(15px, 3.5vw, 17px)", color: "#a5b4fc", fontStyle: "italic", marginBottom: 6, lineHeight: 1.5 }}>{tagline}</div>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(14px, 3vw, 16px)", color: "#7a8ba8", lineHeight: 1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Thin divider */}
      <div style={{ width: "100%", maxWidth: 480, height: 1, background: "linear-gradient(to right, transparent, rgba(42,26,85,0.8), transparent)", marginBottom: 64 }} />

      {/* He remembers */}
      <div style={{ maxWidth: 560, padding: "0 20px", textAlign: "center", marginBottom: 64 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.35em", color: "#4a3870", marginBottom: 24 }}>
          HE REMEMBERS YOU
        </div>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "clamp(16px, 4vw, 19px)", color: "#8878a8", lineHeight: 1.9, fontStyle: "italic" }}>
          Galileo tracks recurring themes across every reading. The second time you come, he knows you've been before. The fifth time, he references patterns you may not have noticed yourself.
        </p>
      </div>

      {/* Quote */}
      <div style={{ maxWidth: 480, padding: "0 32px", textAlign: "center", marginBottom: 48 }}>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#2a1a55", fontStyle: "italic", lineHeight: 1.8 }}>
          "The stars don't lie. They do, however, occasionally withhold."
        </p>
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#2a1a55", marginTop: 8 }}>
          — GALILEO
        </p>
      </div>

      <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 12, color: "#2a1a55", textAlign: "center", fontStyle: "italic", maxWidth: 480, lineHeight: 1.7, marginBottom: 12, padding: "0 24px" }}>
        For entertainment and self-reflection only. All readings are AI-generated and do not constitute professional advice of any kind. No refunds. Enter at your own risk — and with an open mind.
      </p>

      <a href="https://jennasys.pro" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#1a0d3f", textDecoration: "none", marginBottom: 40 }}>
        POWERED BY JENNASYS PRO
      </a>
    </div>
  )
}
