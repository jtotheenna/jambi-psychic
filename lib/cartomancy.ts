export type PlayingCard = {
  name: string
  suit: "Hearts" | "Diamonds" | "Clubs" | "Spades"
  rank: string
  uprightMeaning: string
  keywords: string[]
}

export const CARTOMANCY_DECK: PlayingCard[] = [
  // HEARTS — emotions, relationships, home, love
  { name: "Ace of Hearts",   suit: "Hearts", rank: "Ace",   keywords: ["new love", "home", "joy", "fresh start"],         uprightMeaning: "A new emotional beginning. Love entering the picture. A joyful home or family moment." },
  { name: "Two of Hearts",   suit: "Hearts", rank: "Two",   keywords: ["partnership", "connection", "mutual feeling"],     uprightMeaning: "A meaningful connection or partnership. Two people in agreement of heart." },
  { name: "Three of Hearts", suit: "Hearts", rank: "Three", keywords: ["celebration", "abundance", "creative joy"],        uprightMeaning: "Celebration, friendship, and emotional abundance. A time of shared happiness." },
  { name: "Four of Hearts",  suit: "Hearts", rank: "Four",  keywords: ["stability", "rest", "emotional foundation"],       uprightMeaning: "Emotional stability and rest. A period of reflection or domestic contentment." },
  { name: "Five of Hearts",  suit: "Hearts", rank: "Five",  keywords: ["change", "loss", "transition"],                   uprightMeaning: "A change in emotional circumstances. Grief or disappointment, but not the end." },
  { name: "Six of Hearts",   suit: "Hearts", rank: "Six",   keywords: ["nostalgia", "past love", "reunion"],              uprightMeaning: "The past returning. Nostalgia, an old flame, or childhood memories surfacing." },
  { name: "Seven of Hearts", suit: "Hearts", rank: "Seven", keywords: ["wishful thinking", "illusion", "dreams"],          uprightMeaning: "Romantic idealism or wishful thinking. Fantasies that may not match reality." },
  { name: "Eight of Hearts", suit: "Hearts", rank: "Eight", keywords: ["movement", "walking away", "emotional shift"],    uprightMeaning: "Walking away from something emotional. Seeking more, even at a cost." },
  { name: "Nine of Hearts",  suit: "Hearts", rank: "Nine",  keywords: ["wish fulfilled", "satisfaction", "pleasure"],      uprightMeaning: "The wish card. Something deeply desired is coming — or has arrived." },
  { name: "Ten of Hearts",   suit: "Hearts", rank: "Ten",   keywords: ["happiness", "family", "lasting love"],            uprightMeaning: "The happiest card in the deck. Enduring love, family harmony, deep contentment." },
  { name: "Jack of Hearts",  suit: "Hearts", rank: "Jack",  keywords: ["romantic youth", "kind heart", "admirer"],        uprightMeaning: "A warm-hearted young person. An admirer or romantic figure entering your world." },
  { name: "Queen of Hearts", suit: "Hearts", rank: "Queen", keywords: ["nurturing", "empathy", "loving woman"],           uprightMeaning: "A loving, emotionally intelligent woman. Nurturing energy or a maternal figure." },
  { name: "King of Hearts",  suit: "Hearts", rank: "King",  keywords: ["emotional wisdom", "gentle authority", "kind man"], uprightMeaning: "A generous, emotionally wise man. Someone who leads with his heart." },

  // DIAMONDS — money, work, material world, ambition
  { name: "Ace of Diamonds",   suit: "Diamonds", rank: "Ace",   keywords: ["opportunity", "money", "new venture"],          uprightMeaning: "A financial opportunity or new material beginning. Something valuable is on offer." },
  { name: "Two of Diamonds",   suit: "Diamonds", rank: "Two",   keywords: ["negotiation", "balance", "business partnership"], uprightMeaning: "A deal or negotiation. Two forces in financial or professional balance." },
  { name: "Three of Diamonds", suit: "Diamonds", rank: "Three", keywords: ["legal matters", "contracts", "dispute"],         uprightMeaning: "Legal documents or contracts. A disagreement about money or resources." },
  { name: "Four of Diamonds",  suit: "Diamonds", rank: "Four",  keywords: ["inheritance", "savings", "material security"],   uprightMeaning: "Financial stability or inheritance. Building security through discipline." },
  { name: "Five of Diamonds",  suit: "Diamonds", rank: "Five",  keywords: ["change in fortune", "news", "instability"],      uprightMeaning: "A change in finances. News that affects your material situation." },
  { name: "Six of Diamonds",   suit: "Diamonds", rank: "Six",   keywords: ["early success", "gifts", "generosity"],          uprightMeaning: "Generosity flowing — given or received. Small but meaningful financial gains." },
  { name: "Seven of Diamonds", suit: "Diamonds", rank: "Seven", keywords: ["criticism", "gossip", "work frustration"],       uprightMeaning: "Criticism at work or petty interference. Frustration with slow material progress." },
  { name: "Eight of Diamonds", suit: "Diamonds", rank: "Eight", keywords: ["apprenticeship", "skill", "new work"],           uprightMeaning: "Learning a new skill or craft. Work that requires patience and dedication." },
  { name: "Nine of Diamonds",  suit: "Diamonds", rank: "Nine",  keywords: ["extra money", "surprise", "achievement"],        uprightMeaning: "Unexpected money or recognition. A surprise in the material realm." },
  { name: "Ten of Diamonds",   suit: "Diamonds", rank: "Ten",   keywords: ["wealth", "prosperity", "long-term success"],     uprightMeaning: "Financial prosperity and long-term abundance. Material goals reached." },
  { name: "Jack of Diamonds",  suit: "Diamonds", rank: "Jack",  keywords: ["messenger", "practical youth", "unreliable news"], uprightMeaning: "A message about money or work. A practical but sometimes unreliable young person." },
  { name: "Queen of Diamonds", suit: "Diamonds", rank: "Queen", keywords: ["sophisticated woman", "ambition", "independence"], uprightMeaning: "An ambitious, independent woman. Someone practical and sharp with resources." },
  { name: "King of Diamonds",  suit: "Diamonds", rank: "King",  keywords: ["powerful man", "business", "authority"],         uprightMeaning: "A powerful man in business or finance. Someone with authority over material matters." },

  // CLUBS — work, career, ambition, practical energy
  { name: "Ace of Clubs",   suit: "Clubs", rank: "Ace",   keywords: ["new project", "ambition", "creative spark"],      uprightMeaning: "A bold new beginning. A project, idea, or ambition ready to launch." },
  { name: "Two of Clubs",   suit: "Clubs", rank: "Two",   keywords: ["obstacles", "waiting", "planning"],               uprightMeaning: "A pause before action. Obstacles ahead, but not insurmountable. Plan carefully." },
  { name: "Three of Clubs", suit: "Clubs", rank: "Three", keywords: ["partnership", "teamwork", "second marriage"],     uprightMeaning: "Collaboration or a meaningful partnership. Strength found in working together." },
  { name: "Four of Clubs",  suit: "Clubs", rank: "Four",  keywords: ["celebration", "home", "achievement"],             uprightMeaning: "A milestone worth celebrating. Stability earned through effort." },
  { name: "Five of Clubs",  suit: "Clubs", rank: "Five",  keywords: ["conflict", "competition", "new relationship"],   uprightMeaning: "Tension or competition in the practical realm. A new alliance formed through friction." },
  { name: "Six of Clubs",   suit: "Clubs", rank: "Six",   keywords: ["success", "progress", "support"],                 uprightMeaning: "Progress and forward momentum. Help arriving to push things forward." },
  { name: "Seven of Clubs", suit: "Clubs", rank: "Seven", keywords: ["challenge", "persistence", "opposition"],         uprightMeaning: "Opposition that must be met head-on. Victory is possible with persistence." },
  { name: "Eight of Clubs", suit: "Clubs", rank: "Eight", keywords: ["speed", "travel", "sudden news"],                 uprightMeaning: "Things moving fast. Sudden news or rapid developments in work or travel." },
  { name: "Nine of Clubs",  suit: "Clubs", rank: "Nine",  keywords: ["achievement", "discipline", "new chapter"],      uprightMeaning: "Hard-won achievement. A chapter closing as a stronger one begins." },
  { name: "Ten of Clubs",   suit: "Clubs", rank: "Ten",   keywords: ["burden", "responsibility", "travel"],             uprightMeaning: "A heavy load — chosen or given. Success is near but demands are high." },
  { name: "Jack of Clubs",  suit: "Clubs", rank: "Jack",  keywords: ["reliable friend", "loyal ally", "honest youth"], uprightMeaning: "A trustworthy young person or friend. Someone dependable in practical matters." },
  { name: "Queen of Clubs", suit: "Clubs", rank: "Queen", keywords: ["confident woman", "practical strength", "charm"], uprightMeaning: "A confident, capable woman. Strong practical energy with natural charisma." },
  { name: "King of Clubs",  suit: "Clubs", rank: "King",  keywords: ["honest man", "leadership", "generosity"],        uprightMeaning: "An honest and generous leader. Someone with integrity and real-world power." },

  // SPADES — conflict, challenges, truth, change
  { name: "Ace of Spades",   suit: "Spades", rank: "Ace",   keywords: ["death", "endings", "transformation", "truth"],    uprightMeaning: "The most powerful card. An ending that clears the way. Absolute truth, no matter how sharp." },
  { name: "Two of Spades",   suit: "Spades", rank: "Two",   keywords: ["indecision", "stalemate", "separation"],          uprightMeaning: "A difficult choice or separation. Two paths — neither easy. Something must break." },
  { name: "Three of Spades", suit: "Spades", rank: "Three", keywords: ["heartbreak", "third party", "sorrow"],            uprightMeaning: "Sorrow or heartbreak, often involving a third person. Grief that must be felt." },
  { name: "Four of Spades",  suit: "Spades", rank: "Four",  keywords: ["rest", "illness", "withdrawal"],                  uprightMeaning: "Rest, recovery, or retreat. The body or mind demanding a pause." },
  { name: "Five of Spades",  suit: "Spades", rank: "Five",  keywords: ["defeat", "loss", "setback"],                      uprightMeaning: "A loss or defeat — temporary. Humility required before moving forward." },
  { name: "Six of Spades",   suit: "Spades", rank: "Six",   keywords: ["transition", "gradual improvement", "travel"],    uprightMeaning: "Moving from rougher waters into calmer ones. Slow but real progress." },
  { name: "Seven of Spades", suit: "Spades", rank: "Seven", keywords: ["deception", "betrayal", "hidden truth"],          uprightMeaning: "Someone is not telling the full truth. A hidden motive or quiet betrayal." },
  { name: "Eight of Spades", suit: "Spades", rank: "Eight", keywords: ["restriction", "stuck", "self-imposed limits"],    uprightMeaning: "Feeling trapped or restricted. Often by one's own fear or inaction." },
  { name: "Nine of Spades",  suit: "Spades", rank: "Nine",  keywords: ["anxiety", "fear", "bad news"],                    uprightMeaning: "The anxiety card. Worry, bad news, or a dark night of the soul." },
  { name: "Ten of Spades",   suit: "Spades", rank: "Ten",   keywords: ["painful ending", "crisis", "rock bottom"],        uprightMeaning: "A painful ending or crisis point. Rock bottom — but the only direction now is up." },
  { name: "Jack of Spades",  suit: "Spades", rank: "Jack",  keywords: ["cunning youth", "deception", "outsider"],         uprightMeaning: "A sharp, cunning person. Not always trustworthy — may act against your interests." },
  { name: "Queen of Spades", suit: "Spades", rank: "Queen", keywords: ["sharp woman", "widow", "bitter truth"],           uprightMeaning: "A perceptive, sometimes sharp woman. Someone who sees clearly and speaks plainly." },
  { name: "King of Spades",  suit: "Spades", rank: "King",  keywords: ["authority", "law", "stern judgment"],             uprightMeaning: "A figure of authority — a judge, lawyer, or strict patriarch. Law and consequence." },
]

export function shuffleCartomancy(count: number): PlayingCard[] {
  const deck = [...CARTOMANCY_DECK]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck.slice(0, count)
}
