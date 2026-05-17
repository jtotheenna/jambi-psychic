"use client"

import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"

function WelcomeForm() {
  const params = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState(params.get("email") ?? "")
  const [firstName, setFirstName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    const session = params.get("session")
    if (!session || email) return
    setResolving(true)
    fetch(`/api/auth/session-email?session=${session}`)
      .then(r => r.json())
      .then(d => { if (d.email) setEmail(d.email) })
      .finally(() => setResolving(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError("At least 6 characters."); return }
    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, firstName }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Something went wrong."); setLoading(false); return }

    if (data.existing) {
      setError("You already have an account — sign in with your existing word below.")
      setLoading(false)
      return
    }

    if (typeof window !== "undefined" && (window as any).ttq) {
      ;(window as any).ttq.track("Purchase", { contents: [{ content_id: "yes-no", content_type: "product", content_name: "Yes or No Oracle" }], value: 5, currency: "USD" })
    }

    const result = await signIn("credentials", {
      email, password, redirect: false,
    })
    if (result?.error) { setError("Could not sign in. Try again."); setLoading(false); return }

    if (typeof window !== "undefined" && (window as any).ttq) {
      ;(window as any).ttq.track("Purchase", { contents: [{ content_id: "yes-no", content_type: "product", content_name: "Yes or No Oracle" }], value: 5, currency: "USD" })
    }

    // Small delay so NextAuth session cookie is fully set, then hard navigate
    await new Promise(r => setTimeout(r, 500))
    window.location.href = "/api/auth/active-reading?redirect=1"
  }

  const inp: React.CSSProperties = {
    width: "100%", background: "rgba(10,5,32,0.8)",
    border: "1px solid rgba(42,26,85,0.8)", borderRadius: 6,
    padding: "14px 16px", color: "#ddd8f0",
    fontFamily: "'EB Garamond', serif", fontSize: 17, outline: "none",
    boxSizing: "border-box",
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: "clamp(24px, 6vw, 32px)", letterSpacing: "0.1em", color: "#c9a84c" }}>GALILEO</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.3em", color: "#7a8ba8", marginTop: 4 }}>THE CELESTIAL ORACLE</div>
        </div>

        <div style={{ padding: "40px 36px", borderRadius: 12, border: "1px solid rgba(42,26,85,0.8)", background: "linear-gradient(135deg, #0d0823 0%, #04020e 100%)" }}>
          <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 22, color: "#ddd8f0", textAlign: "center", fontStyle: "italic", lineHeight: 1.6, marginBottom: 8 }}>
            Payment received.
          </div>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#8878a8", textAlign: "center", lineHeight: 1.7, marginBottom: 32 }}>
            Create your account to begin your reading with Galileo.
          </p>

          {resolving ? (
            <div style={{ textAlign: "center", fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#6a5a8a", fontStyle: "italic" }}>Finding your reading…</div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#7a8ba8", marginBottom: 8 }}>YOUR FIRST NAME</label>
                <input
                  type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="First name"
                  autoComplete="given-name"
                  style={inp}
                  onFocus={e => (e.target.style.borderColor = "rgba(165,180,252,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(42,26,85,0.8)")}
                />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#7a8ba8", marginBottom: 8 }}>YOUR EMAIL</label>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  style={inp}
                  onFocus={e => (e.target.style.borderColor = "rgba(165,180,252,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(42,26,85,0.8)")}
                />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#7a8ba8", marginBottom: 8 }}>CHOOSE A WORD</label>
                <input
                  type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="6 characters or more"
                  style={inp}
                  onFocus={e => (e.target.style.borderColor = "rgba(165,180,252,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(42,26,85,0.8)")}
                />
              </div>

              {error && <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#be123c", textAlign: "center", fontStyle: "italic" }}>{error}</div>}

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "16px", borderRadius: 6,
                border: "1px solid rgba(201,168,76,0.5)",
                background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(79,70,229,0.12))",
                color: "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.25em",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
              }}>
                {loading ? "ENTERING…" : "CREATE MY ACCOUNT ✦"}
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: "rgba(42,26,85,0.5)" }} />
                <span style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#4a3870", fontStyle: "italic" }}>already have an account?</span>
                <div style={{ flex: 1, height: 1, background: "rgba(42,26,85,0.5)" }} />
              </div>

              <Link href={`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`} style={{
                width: "100%", padding: "14px", borderRadius: 6, textAlign: "center",
                border: "1px solid rgba(165,180,252,0.3)", background: "rgba(79,70,229,0.08)",
                color: "#a5b4fc", fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.2em",
                textDecoration: "none", display: "block",
              }}>
                SIGN IN INSTEAD ✦
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function WelcomePage() {
  return <Suspense><WelcomeForm /></Suspense>
}
