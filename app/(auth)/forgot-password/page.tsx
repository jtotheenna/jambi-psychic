"use client"
import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 28, letterSpacing: "0.1em", color: "#f0cc6e" }}>GALILEO</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.3em", color: "#7a8ba8", marginTop: 4 }}>THE CELESTIAL ORACLE</div>
        </div>

        <div className="border-ornate rounded-xl p-8" style={{ background: "linear-gradient(135deg, #0d0823 0%, #04020e 100%)" }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", color: "#c9a84c", marginBottom: 16 }}>THE STARS HAVE BEEN CONSULTED</div>
              <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: "#8878a8", fontStyle: "italic", lineHeight: 1.7, marginBottom: 24 }}>
                If that address is known to us, a reset link is on its way. Check your inbox.
              </p>
              <Link href="/login" style={{ color: "#a5b4fc", fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", textDecoration: "none" }}>
                RETURN ✦
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", color: "#c8d4e8", marginBottom: 24, textAlign: "center" }}>
                LOST YOUR WORD?
              </h1>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={{ display: "block", fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#7a8ba8", marginBottom: 8 }}>
                    YOUR EMAIL
                  </label>
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    style={{ width: "100%", background: "rgba(10,5,32,0.8)", border: "1px solid rgba(42,26,85,0.8)", borderRadius: 6, padding: "14px 16px", color: "#ddd8f0", fontFamily: "'EB Garamond', serif", fontSize: 17, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <button type="submit" disabled={loading} style={{ width: "100%", padding: "16px", borderRadius: 6, border: "1px solid rgba(201,168,76,0.5)", background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(79,70,229,0.12))", color: "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.25em", cursor: "pointer" }}>
                  {loading ? "CONSULTING…" : "SEND RESET LINK ✦"}
                </button>
              </form>
              <div style={{ marginTop: 20, textAlign: "center" }}>
                <Link href="/login" style={{ color: "#4a3870", fontFamily: "'EB Garamond', serif", fontSize: 15, textDecoration: "none" }}>
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
