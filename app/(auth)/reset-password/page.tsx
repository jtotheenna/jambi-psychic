"use client"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function ResetForm() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm]   = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const router = useRouter()
  const token = useSearchParams().get("token") ?? ""

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError("Words don't match."); return }
    if (password.length < 6)  { setError("Must be at least 6 characters."); return }
    setLoading(true); setError("")
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || "Something went wrong."); setLoading(false); return }
    setDone(true)
    setTimeout(() => router.push("/login"), 2000)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(10,5,32,0.8)", border: "1px solid rgba(42,26,85,0.8)",
    borderRadius: 6, padding: "14px 16px", color: "#ddd8f0",
    fontFamily: "'EB Garamond', serif", fontSize: 17, outline: "none", boxSizing: "border-box",
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 28, letterSpacing: "0.1em", color: "#f0cc6e" }}>GALILEO</div>
        </div>
        <div className="border-ornate rounded-xl p-8" style={{ background: "linear-gradient(135deg, #0d0823 0%, #04020e 100%)" }}>
          {done ? (
            <div style={{ textAlign: "center", fontFamily: "'EB Garamond', serif", fontSize: 17, color: "#a5b4fc", fontStyle: "italic" }}>
              Your word has been changed. Returning you to the door…
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", color: "#c8d4e8", marginBottom: 24, textAlign: "center" }}>
                CHOOSE A NEW WORD
              </h1>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={{ display: "block", fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#7a8ba8", marginBottom: 8 }}>NEW WORD</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.2em", color: "#7a8ba8", marginBottom: 8 }}>CONFIRM</label>
                  <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} />
                </div>
                {error && <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: "#be123c", textAlign: "center", fontStyle: "italic" }}>{error}</div>}
                <button type="submit" disabled={loading || !token} style={{ width: "100%", padding: "16px", borderRadius: 6, border: "1px solid rgba(201,168,76,0.5)", background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(79,70,229,0.12))", color: "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.25em", cursor: "pointer" }}>
                  {loading ? "SEALING…" : "SET NEW WORD ✦"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>
}
