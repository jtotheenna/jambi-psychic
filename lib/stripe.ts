import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
})

export const READING_PRICE_CENTS = 1000
export const READING_PRICE_DISPLAY = "$10"
export const EXCHANGES_PER_READING = 10
