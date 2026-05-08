export type TarotCardDraw = {
  id: string
  name: string
  image: string
  arcana: "Major" | "Minor"
  suit: string | null
  orientation: "upright" | "reversed"
}

type TarotCardBase = Omit<TarotCardDraw, "orientation">

const major: TarotCardBase[] = [
  { id: "the-fool",          name: "The Fool",           image: "/cards/the-fool.jpg",          arcana: "Major", suit: null },
  { id: "the-magician",      name: "The Magician",        image: "/cards/the-magician.jpg",      arcana: "Major", suit: null },
  { id: "the-high-priestess",name: "The High Priestess",  image: "/cards/the-high-priestess.jpg",arcana: "Major", suit: null },
  { id: "the-empress",       name: "The Empress",         image: "/cards/the-empress.jpg",       arcana: "Major", suit: null },
  { id: "the-emperor",       name: "The Emperor",         image: "/cards/the-emperor.jpg",       arcana: "Major", suit: null },
  { id: "the-hierophant",    name: "The Hierophant",      image: "/cards/the-hierophant.jpg",    arcana: "Major", suit: null },
  { id: "the-lovers",        name: "The Lovers",          image: "/cards/the-lovers.jpg",        arcana: "Major", suit: null },
  { id: "the-chariot",       name: "The Chariot",         image: "/cards/the-chariot.jpg",       arcana: "Major", suit: null },
  { id: "strength",          name: "Strength",            image: "/cards/strength.jpg",          arcana: "Major", suit: null },
  { id: "the-hermit",        name: "The Hermit",          image: "/cards/the-hermit.jpg",        arcana: "Major", suit: null },
  { id: "wheel-of-fortune",  name: "Wheel of Fortune",    image: "/cards/wheel-of-fortune.jpg",  arcana: "Major", suit: null },
  { id: "justice",           name: "Justice",             image: "/cards/justice.jpg",           arcana: "Major", suit: null },
  { id: "the-hanged-man",    name: "The Hanged Man",      image: "/cards/the-hanged-man.jpg",    arcana: "Major", suit: null },
  { id: "death",             name: "Death",               image: "/cards/death.jpg",             arcana: "Major", suit: null },
  { id: "temperance",        name: "Temperance",          image: "/cards/temperance.jpg",        arcana: "Major", suit: null },
  { id: "the-devil",         name: "The Devil",           image: "/cards/the-devil.jpg",         arcana: "Major", suit: null },
  { id: "the-tower",         name: "The Tower",           image: "/cards/the-tower.jpg",         arcana: "Major", suit: null },
  { id: "the-star",          name: "The Star",            image: "/cards/the-star.jpg",          arcana: "Major", suit: null },
  { id: "the-moon",          name: "The Moon",            image: "/cards/the-moon.jpg",          arcana: "Major", suit: null },
  { id: "the-sun",           name: "The Sun",             image: "/cards/the-sun.jpg",           arcana: "Major", suit: null },
  { id: "judgement",         name: "Judgment",            image: "/cards/judgement.jpg",         arcana: "Major", suit: null },
  { id: "the-world",         name: "The World",           image: "/cards/the-world.jpg",         arcana: "Major", suit: null },
]

function minorSuit(suit: string, suitSlug: string): TarotCardBase[] {
  const ranks = [
    ["ace",   "Ace"],
    ["two",   "Two"],
    ["three", "Three"],
    ["four",  "Four"],
    ["five",  "Five"],
    ["six",   "Six"],
    ["seven", "Seven"],
    ["eight", "Eight"],
    ["nine",  "Nine"],
    ["ten",   "Ten"],
    ["page",  "Page"],
    ["knight","Knight"],
    ["queen", "Queen"],
    ["king",  "King"],
  ]
  return ranks.map(([slug, label]) => ({
    id:     `${slug}-of-${suitSlug}`,
    name:   `${label} of ${suit}`,
    image:  `/cards/${slug}-of-${suitSlug}.jpg`,
    arcana: "Minor" as const,
    suit,
  }))
}

export const LIVE_TAROT_DECK: TarotCardBase[] = [
  ...major,
  ...minorSuit("Wands",    "wands"),
  ...minorSuit("Cups",     "cups"),
  ...minorSuit("Swords",   "swords"),
  ...minorSuit("Pentacles","pentacles"),
]

export function drawTarotCards(count: number): TarotCardDraw[] {
  const deck = [...LIVE_TAROT_DECK]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck.slice(0, count).map(card => ({
    ...card,
    orientation: Math.random() < 0.5 ? "upright" : "reversed",
  }))
}
