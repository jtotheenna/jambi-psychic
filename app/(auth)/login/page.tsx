"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

const DECK = [
  { src: "/cards/the-moon.jpg",    angle: -52, tx: -140, delay: 0 },
  { src: "/cards/the-star.jpg",    angle: -26, tx: -70,  delay: 0.1 },
  { src: "/cards/the-world.jpg",   angle: 0,   tx: 0,    delay: 0.2 },
  { src: "/cards/judgement.jpg",   angle: 26,  tx: 70,   delay: 0.3 },
  { src: "/cards/the-sun.jpg",     angle: 52,  tx: 140,  delay: 0.4 },
]

function ShufflingDeck() {
  return (
    <>
      <style>{`
        @keyframes fanOut {
          0%, 5%   { transform: rotate(0deg) translateX(0px) translateY(0px); opacity: 0.3; }
          25%, 70% { transform: rotate(var(--angle)) translateX(var(--tx)) translateY(-30px); opacity: 0.85; }
          90%, 100% { transform: rotate(0deg) translateX(0px) translateY(0px); opacity: 0.3; }
        }
        @keyframes cardShimmer {
          0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,168,76,0.2); }
          50%       { box-shadow: 0 8px 32px rgba(0,0,0,0.8), 0 0 20px rgba(201,168,76,0.3), 0 0 0 1px rgba(201,168,76,0.4); }
        }
      `}</style>
      <div style={{
        position: "fixed", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        pointerEvents: "none", zIndex: 0,
      }}>
        {DECK.map((card, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 110,
              height: 184,
              borderRadius: 10,
              overflow: "hidden",
              // @ts-expect-error css vars
              "--angle": `${card.angle}deg`,
              "--tx": `${card.tx}px`,
              animation: `fanOut 8s ease-in-out ${card.delay}s infinite, cardShimmer 4s ease-in-out ${card.delay * 2}s infinite`,
              transformOrigin: "bottom center",
              willChange: "transform",
            }}
          >
            <Image src={card.src} alt="" fill style={{ objectFit: "cover" }} sizes="110px" />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to bottom, transparent 60%, rgba(4,2,14,0.5) 100%)",
            }} />
          </div>
        ))}
      </div>
    </>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("The stars do not recognize these credentials.")
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ position: "relative" }}>
      <ShufflingDeck />
      <div className="w-full max-w-md" style={{ position: "relative", zIndex: 1 }}>
        <div className="text-center mb-10">
          <div
            style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 28,
              letterSpacing: "0.1em",
            }}
            className="text-shimmer mb-2"
          >
            GALILEO
          </div>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 12,
              letterSpacing: "0.25em",
              color: "#7a8ba8",
            }}
          >
            THE CELESTIAL ORACLE
          </div>
        </div>

        <div
          className="border-ornate rounded-xl p-8"
          style={{ background: "linear-gradient(135deg, #0d0823 0%, #04020e 100%)" }}
        >
          <h1
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 16,
              letterSpacing: "0.2em",
              color: "#c8d4e8",
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            RETURN TO THE BOX
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "'Cinzel', serif",
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  color: "#7a8ba8",
                  marginBottom: 8,
                }}
              >
                YOUR EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  background: "rgba(10,5,32,0.8)",
                  border: "1px solid rgba(42,26,85,0.8)",
                  borderRadius: 8,
                  padding: "12px 16px",
                  color: "#ddd8f0",
                  fontFamily: "'EB Garamond', serif",
                  fontSize: 16,
                  outline: "none",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(165,180,252,0.5)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(42,26,85,0.8)")
                }
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "'Cinzel', serif",
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  color: "#7a8ba8",
                  marginBottom: 8,
                }}
              >
                YOUR WORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  background: "rgba(10,5,32,0.8)",
                  border: "1px solid rgba(42,26,85,0.8)",
                  borderRadius: 8,
                  padding: "12px 16px",
                  color: "#ddd8f0",
                  fontFamily: "'EB Garamond', serif",
                  fontSize: 16,
                  outline: "none",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(165,180,252,0.5)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(42,26,85,0.8)")
                }
              />
            </div>

            {error && (
              <div
                style={{
                  fontFamily: "'EB Garamond', serif",
                  fontSize: 15,
                  color: "#be123c",
                  textAlign: "center",
                  fontStyle: "italic",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 8,
                border: "1px solid rgba(201,168,76,0.5)",
                background: loading
                  ? "rgba(42,26,85,0.4)"
                  : "linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(79,70,229,0.15) 100%)",
                color: loading ? "#7a6230" : "#c9a84c",
                fontFamily: "'Cinzel', serif",
                fontSize: 12,
                letterSpacing: "0.2em",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
              }}
            >
              {loading ? "CONSULTING THE STARS..." : "ENTER"}
            </button>
          </form>

          <div
            style={{
              marginTop: 24,
              textAlign: "center",
              fontFamily: "'EB Garamond', serif",
              fontSize: 15,
              color: "#7a8ba8",
            }}
          >
            First time?{" "}
            <Link
              href="/signup"
              style={{ color: "#a5b4fc", textDecoration: "none" }}
            >
              Open the box
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
