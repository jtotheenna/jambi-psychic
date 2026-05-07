"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ clientSecret, purchaseId }: { clientSecret: string; purchaseId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError("")

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?paid=true`,
      },
    })

    if (stripeError) {
      setError(stripeError.message || "Payment failed. The stars were unimpressed.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 400 }}>
      <PaymentElement options={{ layout: "accordion" }} />
      {error && (
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#be123c", fontStyle: "italic", marginTop: 12, textAlign: "center" }}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !stripe}
        style={{
          marginTop: 20,
          width: "100%",
          padding: "14px",
          borderRadius: 8,
          border: "1px solid rgba(201,168,76,0.5)",
          background: loading ? "rgba(42,26,85,0.4)" : "linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(79,70,229,0.15) 100%)",
          color: loading ? "#7a6230" : "#c9a84c",
          fontFamily: "'Cinzel', serif",
          fontSize: 12,
          letterSpacing: "0.2em",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "OPENING THE BOX..." : "PAY $10 · BEGIN READING"}
      </button>
    </form>
  )
}

export default function PayButton() {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [purchaseId, setPurchaseId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleClick() {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/stripe/create-intent", { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "The cosmos are unavailable right now.")
        setLoading(false)
        return
      }

      setClientSecret(data.clientSecret)
      setPurchaseId(data.purchaseId)
    } catch {
      setError("Something stirred in the void. Please try again.")
    }

    setLoading(false)
  }

  if (clientSecret) {
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "night",
              variables: {
                colorPrimary: "#c9a84c",
                colorBackground: "#0a0520",
                colorText: "#ddd8f0",
              },
            },
          }}
        >
          <CheckoutForm clientSecret={clientSecret} purchaseId={purchaseId!} />
        </Elements>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          padding: "16px 48px",
          borderRadius: 8,
          border: "1px solid rgba(201,168,76,0.5)",
          background: loading
            ? "rgba(42,26,85,0.4)"
            : "linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(79,70,229,0.15) 100%)",
          color: loading ? "#7a6230" : "#c9a84c",
          fontFamily: "'Cinzel', serif",
          fontSize: 13,
          letterSpacing: "0.2em",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "PREPARING THE BOX..." : "BEGIN — $10"}
      </button>
      {error && (
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: "#be123c", fontStyle: "italic", marginTop: 12 }}>
          {error}
        </p>
      )}
    </div>
  )
}
