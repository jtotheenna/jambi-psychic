"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"

function WelcomeForm() {
  const params = useSearchParams()
  const email = params.get("email") ?? ""
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError("At least 6 characters."); return }
    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Something went wrong."); setLoading(false); return }

    const result = await signIn("credentials", { email, password, redirect: false })
    if (result?.error) { setError("Could not sign in. Try again."); setLoading(false); return }
    router.push("/dashboard")
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
            Your reading is ready.
          </div>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, color: "#8878a8", textAlign: "center", lineHeight: 1.7, marginBottom: 32 }}>
            Set a word to access it now and return whenever you wish.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#7a8ba8", marginBottom: 8 }}>YOUR EMAIL</label>
              <input value={email} readOnly style={{ ...inp, color: "#6a5a8a" }} />
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
              {loading ? "ENTERING…" : "ENTER THE BOX ✦"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function WelcomePage() {
  return <Suspense><WelcomeForm /></Suspense>
}
