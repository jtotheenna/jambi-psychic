"use client"

import { useState, Suspense } from "react"
import { useFormStatus } from "react-dom"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { signIn } from "next-auth/react"

const ALL_CARDS = [
  "the-moon","the-star","the-world","judgement","the-sun","the-fool",
  "the-magician","the-tower","strength","the-hermit","the-lovers",
  "wheel-of-fortune","the-high-priestess","the-empress","death","temperance",
  "ace-of-cups","queen-of-wands","knight-of-swords","ten-of-pentacles",
]

const POSITIONS = [
  { side: "left",  pct: "8%",  top: "8vh",  rot: -8,  dur: 18, delay: 0   },
  { side: "left",  pct: "18%", top: "42vh", rot: -4,  dur: 22, delay: 4   },
  { side: "left",  pct: "10%", top: "68vh", rot: -10, dur: 20, delay: 8   },
  { side: "right", pct: "8%",  top: "18vh", rot:  7,  dur: 20, delay: 2   },
  { side: "right", pct: "18%", top: "52vh", rot:  4,  dur: 18, delay: 6   },
  { side: "right", pct: "9%",  top: "76vh", rot:  9,  dur: 22, delay: 10  },
]

function ShufflingDeck() {
  const [slugs] = useState(() => [...ALL_CARDS].sort(() => Math.random() - 0.5).slice(0, 6))
  return (
    <>
      <style>{`
        @keyframes materialize {
          0%         { opacity: 0; transform: translateY(12px) rotate(var(--rot)) scale(0.96); filter: brightness(0.3) blur(3px); }
          18%, 75%   { opacity: 0.88; transform: translateY(0px) rotate(var(--rot)) scale(1); filter: brightness(1) blur(0px); }
          50%        { transform: translateY(-10px) rotate(var(--rot)) scale(1); box-shadow: 0 24px 64px rgba(0,0,0,0.9), 0 0 30px rgba(201,168,76,0.12), 0 0 0 1px rgba(201,168,76,0.4); }
          100%       { opacity: 0; transform: translateY(12px) rotate(var(--rot)) scale(0.96); filter: brightness(0.3) blur(3px); }
        }
      `}</style>
      {POSITIONS.map((p, i) => (
        <div key={i} className="side-card" style={{
          position: "fixed", top: p.top, [p.side]: p.pct,
          width: 110, height: 184, borderRadius: 9, overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.85), 0 0 0 1px rgba(201,168,76,0.2)",
          pointerEvents: "none", zIndex: 0,
          // @ts-expect-error css vars
          "--rot": `${p.rot}deg`,
          animation: `materialize ${p.dur}s ease-in-out ${p.delay}s infinite`,
        }}>
          <Image src={`/cards/${slugs[i]}.jpg`} alt="" fill style={{ objectFit: "cover" }} sizes="110px" />
        </div>
      ))}
    </>
  )
}

function SubmitButton({ loading }: { loading: boolean }) {
  return (
    <button type="submit" disabled={loading} style={{
      width: "100%", padding: "16px", borderRadius: 6,
      border: "1px solid rgba(201,168,76,0.5)",
      background: loading ? "rgba(42,26,85,0.4)" : "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(79,70,229,0.12) 100%)",
      color: loading ? "#7a6230" : "#c9a84c",
      fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.25em",
      cursor: loading ? "not-allowed" : "pointer",
    }}>
      {loading ? "CONSULTING THE STARS..." : "ENTER"}
    </button>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(10,5,32,0.8)",
  border: "1px solid rgba(42,26,85,0.8)", borderRadius: 6,
  padding: "14px 16px", color: "#ddd8f0",
  fontFamily: "'EB Garamond', serif", fontSize: 17, outline: "none",
  boxSizing: "border-box",
}

function LoginForm() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const created = params.get("created")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const form = e.currentTarget
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value

    const result = await signIn("credentials", { email, password, redirect: false })
    if (result?.error) {
      setError("The stars do not recognize these credentials.")
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative" }}>
      <ShufflingDeck />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: "clamp(24px, 6vw, 32px)", letterSpacing: "0.1em" }} className="text-shimmer mb-2">
            GALILEO
          </div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.3em", color: "#7a8ba8" }}>
            THE CELESTIAL ORACLE
          </div>
        </div>

        <div className="border-ornate rounded-xl p-8" style={{ background: "linear-gradient(135deg, #0d0823 0%, #04020e 100%)" }}>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 14, letterSpacing: "0.2em", color: "#c8d4e8", marginBottom: 24, textAlign: "center" }}>
            RETURN TO THE BOX
          </h1>

          {created && (
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#a5b4fc", textAlign: "center", fontStyle: "italic", marginBottom: 16 }}>
              Account created — welcome. Sign in below.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#7a8ba8", marginBottom: 8 }}>
                YOUR EMAIL
              </label>
              <input name="email" type="email" required style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "rgba(165,180,252,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(42,26,85,0.8)")} />
            </div>

            <div>
              <label style={{ display: "block", fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#7a8ba8", marginBottom: 8 }}>
                YOUR WORD
              </label>
              <input name="password" type="password" required style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "rgba(165,180,252,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(42,26,85,0.8)")} />
            </div>

            {error && (
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#be123c", textAlign: "center", fontStyle: "italic" }}>
                {error}
              </div>
            )}

            <SubmitButton loading={loading} />
          </form>

          <div style={{ marginTop: 20, textAlign: "center", fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#7a8ba8" }}>
            First time?{" "}
            <Link href="/signup" style={{ color: "#a5b4fc", textDecoration: "none" }}>Open the box</Link>
          </div>
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 20, left: 0, right: 0, textAlign: "center", zIndex: 1 }}>
        <a href="https://jennasys.pro" target="_blank" rel="noopener noreferrer"
          style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#2a1a55", textDecoration: "none" }}>
          POWERED BY JENNASYS PRO
        </a>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
