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

export const READING_PRICE_CENTS = 1500
export const READING_PRICE_DISPLAY = "$15"
export const EXCHANGES_PER_READING = 5

export const PALM_PRICE_CENTS = 500
export const PALM_PRICE_DISPLAY = "$5"

export const MOON_PRICE_CENTS = 500
export const MOON_PRICE_DISPLAY = "$5"
