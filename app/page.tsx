import Link from "next/link"
import { auth } from "@/lib/auth"

export default async function LandingPage() {
  const session = await auth()

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Moon */}
      <div
        className="animate-moon-pulse"
        style={{
          fontSize: 52,
          color: "#c8d4e8",
          textShadow: "0 0 30px rgba(200,212,232,0.6), 0 0 60px rgba(165,180,252,0.3)",
          marginBottom: 24,
        }}
      >
        ☽
      </div>

      {/* Title */}
      <h1
        style={{
          fontFamily: "'Cinzel Decorative', serif",
          fontSize: "clamp(32px, 6vw, 64px)",
          letterSpacing: "0.12em",
          textAlign: "center",
          marginBottom: 8,
          lineHeight: 1.2,
        }}
        className="text-shimmer"
      >
        GALILEO
      </h1>

      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 13,
          letterSpacing: "0.3em",
          color: "#7a8ba8",
          marginBottom: 40,
          textAlign: "center",
        }}
      >
        THE CELESTIAL ORACLE
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: "'EB Garamond', serif",
          fontSize: 20,
          lineHeight: 1.8,
          color: "#8878a8",
          maxWidth: 480,
          textAlign: "center",
          fontStyle: "italic",
          marginBottom: 16,
        }}
      >
        He has been inside the box since before the first star was named.
        He knows your situation. He has probably seen it before.
        He cares about you anyway.
      </p>

      <p
        style={{
          fontFamily: "'EB Garamond', serif",
          fontSize: 16,
          color: "#4a3870",
          textAlign: "center",
          marginBottom: 48,
        }}
      >
        Tarot readings · Cosmic questions · Life counsel · 10 visions for $10
      </p>

      {/* CTA */}
      {session?.user ? (
        <Link
          href="/dashboard"
          style={{
            padding: "18px 56px",
            borderRadius: 8,
            border: "1px solid rgba(201,168,76,0.5)",
            background: "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(79,70,229,0.12) 100%)",
            color: "#c9a84c",
            fontFamily: "'Cinzel', serif",
            fontSize: 13,
            letterSpacing: "0.2em",
            textDecoration: "none",
            display: "inline-block",
            boxShadow: "0 0 20px rgba(201,168,76,0.1)",
            transition: "all 0.3s ease",
          }}
        >
          YOUR READINGS
        </Link>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <Link
            href="/signup"
            style={{
              padding: "18px 56px",
              borderRadius: 8,
              border: "1px solid rgba(201,168,76,0.5)",
              background: "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(79,70,229,0.12) 100%)",
              color: "#c9a84c",
              fontFamily: "'Cinzel', serif",
              fontSize: 13,
              letterSpacing: "0.2em",
              textDecoration: "none",
              display: "inline-block",
              boxShadow: "0 0 20px rgba(201,168,76,0.1)",
            }}
          >
            OPEN THE BOX
          </Link>
          <Link
            href="/login"
            style={{
              fontFamily: "'EB Garamond', serif",
              fontSize: 15,
              color: "#7a8ba8",
              textDecoration: "none",
              fontStyle: "italic",
            }}
          >
            I have been here before
          </Link>
        </div>
      )}

      {/* What Galileo knows */}
      <div
        style={{
          marginTop: 80,
          maxWidth: 640,
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 16,
        }}
      >
        {[
          { icon: "☽", label: "Tarot", desc: "All 78 cards. Every spread. Real interpretation." },
          { icon: "✦", label: "Anything", desc: "Dark matter, heartbreak, career, quantum mechanics." },
          { icon: "◆", label: "Memory", desc: "He remembers you. Past readings, recurring themes." },
          { icon: "★", label: "Voice", desc: "He speaks. You listen. That's how this works." },
        ].map(({ icon, label, desc }) => (
          <div
            key={label}
            style={{
              padding: 20,
              borderRadius: 8,
              border: "1px solid rgba(42,26,85,0.6)",
              background: "rgba(10,5,32,0.4)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 8, color: "#c9a84c" }}>{icon}</div>
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 10,
                letterSpacing: "0.2em",
                color: "#c8d4e8",
                marginBottom: 6,
              }}
            >
              {label.toUpperCase()}
            </div>
            <div
              style={{
                fontFamily: "'EB Garamond', serif",
                fontSize: 14,
                color: "#4a3870",
                lineHeight: 1.5,
              }}
            >
              {desc}
            </div>
          </div>
        ))}
      </div>

      <p
        style={{
          marginTop: 60,
          fontFamily: "'EB Garamond', serif",
          fontSize: 13,
          color: "#2a1a55",
          textAlign: "center",
          fontStyle: "italic",
        }}
      >
        "The stars don't lie. They do, however, occasionally withhold." — Galileo
      </p>
    </div>
  )
}
