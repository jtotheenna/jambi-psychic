import { buildPaymentUrl } from "@/lib/stripe"
import LandingPage from "./LandingPage"

const READING_TYPES = ["tarot","cartomancy","love","palm","astrology","aura","dream","moon","guide","yes-no"]

export default function Page() {
  const guestLinks: Record<string, string | null> = {}
  for (const type of READING_TYPES) {
    guestLinks[type] = buildPaymentUrl(type, "guest")
  }
  return <LandingPage guestLinks={guestLinks} />
}
