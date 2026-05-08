export type CartomancyCard = {
  id: string
  name: string
  value: string
  suit: "Hearts" | "Diamonds" | "Clubs" | "Spades"
  suitSymbol: string
  color: "red" | "black"
  meaning: string
  keywords: string[]
}

export type CartomancyCardDraw = CartomancyCard & {
  orientation: "upright" | "reversed"
}

const VALUES = ["Ace","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Jack","Queen","King"] as const
const SHORT: Record<string, string> = {
  Ace:"A", Two:"2", Three:"3", Four:"4", Five:"5",
  Six:"6", Seven:"7", Eight:"8", Nine:"9", Ten:"10",
  Jack:"J", Queen:"Q", King:"K",
}

type SuitMeta = { suit: CartomancyCard["suit"]; symbol: string; color: CartomancyCard["color"] }
const SUITS: SuitMeta[] = [
  { suit: "Hearts",   symbol: "♥", color: "red"   },
  { suit: "Diamonds", symbol: "♦", color: "red"   },
  { suit: "Clubs",    symbol: "♣", color: "black" },
  { suit: "Spades",   symbol: "♠", color: "black" },
]

// Cartomancy meanings — traditional Western system
const MEANINGS: Record<string, { meaning: string; keywords: string[] }> = {
  // ── Hearts ─────────────────────────────────────────────────────────────
  "ace-of-hearts":   { meaning: "New love beginning, a joyful home, emotional fresh start", keywords: ["new love","home","happiness","fresh start"] },
  "two-of-hearts":   { meaning: "A deep partnership, romantic connection, engagement energy", keywords: ["partnership","romance","union","connection"] },
  "three-of-hearts": { meaning: "Celebration and creativity in love; good luck with relationships", keywords: ["celebration","luck","creativity","joy"] },
  "four-of-hearts":  { meaning: "Stability and contentment at home; a loving foundation", keywords: ["stability","home","contentment","foundation"] },
  "five-of-hearts":  { meaning: "Jealousy or emotional conflict; a past love still lingering", keywords: ["jealousy","conflict","longing","loss"] },
  "six-of-hearts":   { meaning: "Nostalgia, past loves, childhood memories shaping the present", keywords: ["nostalgia","past","memories","innocence"] },
  "seven-of-hearts": { meaning: "Wishful thinking; illusions in love; what you hope for vs. what is", keywords: ["illusion","hope","wishful","desire"] },
  "eight-of-hearts": { meaning: "Disappointment or walking away; releasing what no longer serves the heart", keywords: ["disappointment","moving on","release","change"] },
  "nine-of-hearts":  { meaning: "The Wish Card — your heart's desire is coming; deepest wish fulfilled", keywords: ["wish","fulfillment","desire","manifestation"] },
  "ten-of-hearts":   { meaning: "Great happiness, family blessings, emotional abundance and success", keywords: ["happiness","family","abundance","success"] },
  "jack-of-hearts":  { meaning: "A warm, romantic young person; good news about love is coming", keywords: ["young lover","good news","warmth","romance"] },
  "queen-of-hearts": { meaning: "A loving, nurturing woman; emotional wisdom; motherly energy", keywords: ["nurturing","love","emotional","mother"] },
  "king-of-hearts":  { meaning: "A kind, emotionally mature man; generous heart; wisdom in love", keywords: ["generosity","emotional wisdom","kind man","leader"] },

  // ── Diamonds ───────────────────────────────────────────────────────────
  "ace-of-diamonds":   { meaning: "New financial opportunity, an important message, a ring or gift", keywords: ["opportunity","money","new start","message"] },
  "two-of-diamonds":   { meaning: "A business partnership or financial agreement forming", keywords: ["partnership","business","agreement","collaboration"] },
  "three-of-diamonds": { meaning: "Legal matters, disputes about money; clarity needed in finances", keywords: ["legal","dispute","clarity","negotiation"] },
  "four-of-diamonds":  { meaning: "Inheritance or financial stability; something of value being preserved", keywords: ["inheritance","stability","savings","security"] },
  "five-of-diamonds":  { meaning: "Unexpected change in finances; loss or instability; a shift coming", keywords: ["change","loss","instability","shift"] },
  "six-of-diamonds":   { meaning: "Small financial gift or win; generosity flowing in or out", keywords: ["gift","generosity","small win","giving"] },
  "seven-of-diamonds": { meaning: "Financial struggle or work problems; effort needed to overcome", keywords: ["struggle","work","effort","challenge"] },
  "eight-of-diamonds": { meaning: "New job, skill development, a practical new direction opening", keywords: ["new job","skills","practical","direction"] },
  "nine-of-diamonds":  { meaning: "Unexpected financial windfall or pleasant surprise; travel possible", keywords: ["windfall","surprise","travel","abundance"] },
  "ten-of-diamonds":   { meaning: "Great wealth, material success, a large financial achievement", keywords: ["wealth","success","achievement","prosperity"] },
  "jack-of-diamonds":  { meaning: "A practical young person with news about money or business", keywords: ["news","practical","young","messenger"] },
  "queen-of-diamonds": { meaning: "A practical, ambitious woman; financial intelligence; material wisdom", keywords: ["ambition","practical","business woman","material"] },
  "king-of-diamonds":  { meaning: "A powerful, financially successful man; authority in business", keywords: ["power","success","authority","business man"] },

  // ── Clubs ──────────────────────────────────────────────────────────────
  "ace-of-clubs":   { meaning: "New creative project, inspiration, good news about work or ambitions", keywords: ["new project","inspiration","good news","creation"] },
  "two-of-clubs":   { meaning: "Obstacles ahead; a delay or disagreement blocking forward movement", keywords: ["obstacle","delay","disagreement","block"] },
  "three-of-clubs": { meaning: "Long-term success through planning; ambitious vision paying off", keywords: ["success","planning","ambition","foresight"] },
  "four-of-clubs":  { meaning: "Rest and celebration; stability after effort; foundations firm", keywords: ["rest","celebration","stability","reward"] },
  "five-of-clubs":  { meaning: "Competition or conflict; rivals present; friction that pushes growth", keywords: ["competition","conflict","rivalry","growth"] },
  "six-of-clubs":   { meaning: "Victory and achievement; success in work or public recognition", keywords: ["victory","achievement","recognition","success"] },
  "seven-of-clubs": { meaning: "Perseverance through struggle; hard work is paying off; hold firm", keywords: ["perseverance","hard work","struggle","determination"] },
  "eight-of-clubs": { meaning: "Swift movement, fast news, travel, communication accelerating", keywords: ["speed","travel","news","communication"] },
  "nine-of-clubs":  { meaning: "Resilience near the finish line; almost there; one last push", keywords: ["resilience","almost there","persistence","strength"] },
  "ten-of-clubs":   { meaning: "Heavy responsibility or burden; great success demands great effort", keywords: ["burden","responsibility","success","effort"] },
  "jack-of-clubs":  { meaning: "A reliable, helpful young person; encouraging news about work", keywords: ["reliable","helpful","young","good news"] },
  "queen-of-clubs": { meaning: "A confident, creative woman; magnetic and ambitious; strong energy", keywords: ["confidence","creativity","ambition","magnetic"] },
  "king-of-clubs":  { meaning: "A decisive, strong-willed man; natural leader; ambition and vision", keywords: ["leadership","decisive","strong","vision"] },

  // ── Spades ─────────────────────────────────────────────────────────────
  "ace-of-spades":   { meaning: "Major transformation; an ending that clears the way; powerful change", keywords: ["transformation","ending","power","change"] },
  "two-of-spades":   { meaning: "A painful separation or difficult decision that must be made", keywords: ["separation","decision","difficulty","duality"] },
  "three-of-spades": { meaning: "Heartbreak, grief, or conflict; a third party causing pain", keywords: ["heartbreak","grief","conflict","pain"] },
  "four-of-spades":  { meaning: "Rest after illness or struggle; recovery and slow healing underway", keywords: ["rest","recovery","healing","pause"] },
  "five-of-spades":  { meaning: "Loss, defeat, or conflict; a battle where something must be surrendered", keywords: ["loss","defeat","conflict","surrender"] },
  "six-of-spades":   { meaning: "Moving on; slow improvement; journey away from difficulty toward calmer waters", keywords: ["moving on","travel","improvement","transition"] },
  "seven-of-spades": { meaning: "Betrayal or deception; something is not as it seems; use discernment", keywords: ["betrayal","deception","caution","discernment"] },
  "eight-of-spades": { meaning: "Feeling trapped or restricted; powerlessness; a situation that limits freedom", keywords: ["trapped","restriction","powerless","limitation"] },
  "nine-of-spades":  { meaning: "The anxiety card; fear, nightmares, worry; the shadow before dawn", keywords: ["anxiety","fear","worry","shadow"] },
  "ten-of-spades":   { meaning: "A painful ending; the darkest before the dawn; release and transformation", keywords: ["ending","pain","release","transformation"] },
  "jack-of-spades":  { meaning: "A clever, deceptive young person; someone with hidden motives", keywords: ["deceptive","clever","warning","hidden"] },
  "queen-of-spades": { meaning: "A sharp, independent woman who has known loss; clear seeing, cold truth", keywords: ["independence","loss","truth","strength"] },
  "king-of-spades":  { meaning: "A powerful, authoritative man; law, judgment, and hard truth", keywords: ["authority","judgment","law","power"] },
}

export const CARTOMANCY_DECK: CartomancyCard[] = SUITS.flatMap(({ suit, symbol, color }) =>
  VALUES.map((value) => {
    const id = `${value.toLowerCase()}-of-${suit.toLowerCase()}`
    return {
      id,
      name: `${value} of ${suit}`,
      value,
      suit,
      suitSymbol: symbol,
      color,
      short: SHORT[value],
      ...(MEANINGS[id] ?? { meaning: "Trust what arises from this card.", keywords: [] }),
    }
  })
)

export function drawCartomancyCards(count: number): CartomancyCardDraw[] {
  const deck = [...CARTOMANCY_DECK]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck.slice(0, count).map(card => ({
    ...card,
    orientation: Math.random() < 0.5 ? "upright" : "reversed",
  }))
}
