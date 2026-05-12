import Stripe from "stripe"

// Lazy init — avoids crashing at build time when env var isn't set
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set")
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" })
  }
  return _stripe
}
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) { return getStripe()[prop as keyof Stripe] },
})

// Prices (in cents) — must match Stripe payment links
export const PRICES: Record<string, number> = {
  tarot:      1500,
  cartomancy: 1500,
  love:       1500,
  palm:        700,
  astrology:   700,
  aura:       1200,
  dream:      1200,
  moon:        700,
  guide:       500,
  "yes-no":    500,
}

// Exchanges per reading type
export const EXCHANGES: Record<string, number> = {
  tarot:      4,
  cartomancy: 4,
  love:       4,
  palm:       1,
  astrology:  1,
  aura:       1,
  dream:      4,
  moon:       1,
  guide:      1,
  "yes-no":   1,
}

// Env var name for each type's Stripe Payment Link
export function paymentLinkEnvKey(type: string): string {
  // Match Railway env var naming: STRIPE_{TYPE}_LINK
  // Special case: astrology uses STRIPE_NATAL_LINK
  if (type === "astrology") return "STRIPE_NATAL_LINK"
  return `STRIPE_${type.replace(/-/g, "_").toUpperCase()}_LINK`
}

export function getPaymentLink(type: string): string | null {
  return process.env[paymentLinkEnvKey(type)] ?? null
}

// Build the full redirect URL for a Stripe Payment Link, injecting client_reference_id
export function buildPaymentUrl(type: string, userId: string, email?: string | null): string | null {
  const base = getPaymentLink(type)
  if (!base) return null
  const url = new URL(base)
  url.searchParams.set("client_reference_id", `${userId}--${type}`)
  if (email) url.searchParams.set("prefilled_email", email)
  return url.toString()
}

// Legacy aliases
export const READING_PRICE_CENTS  = PRICES.tarot
export const READING_PRICE_DISPLAY = "$15"
export const EXCHANGES_PER_READING = EXCHANGES.tarot
export const PALM_PRICE_CENTS      = PRICES.palm
export const MOON_PRICE_CENTS      = PRICES.moon
