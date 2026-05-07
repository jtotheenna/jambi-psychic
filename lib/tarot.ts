export type TarotCard = {
  name: string
  arcana: "major" | "minor"
  suit?: string
  number?: number | string
  keywords: string[]
  uprightMeaning: string
  reversedMeaning: string
}

export const TAROT_DECK: TarotCard[] = [
  // Major Arcana
  { name: "The Fool", arcana: "major", number: 0, keywords: ["new beginnings", "innocence", "adventure", "freedom"], uprightMeaning: "New beginnings, innocence, spontaneity, a free spirit", reversedMeaning: "Holding back, recklessness, risk-taking" },
  { name: "The Magician", arcana: "major", number: 1, keywords: ["manifestation", "resourcefulness", "power", "inspired action"], uprightMeaning: "Manifestation, resourcefulness, inspired action, skill", reversedMeaning: "Manipulation, poor planning, untapped talents" },
  { name: "The High Priestess", arcana: "major", number: 2, keywords: ["intuition", "sacred knowledge", "mystery", "inner voice"], uprightMeaning: "Intuition, sacred knowledge, divine feminine, subconscious mind", reversedMeaning: "Secrets, disconnected from intuition, withdrawal" },
  { name: "The Empress", arcana: "major", number: 3, keywords: ["femininity", "beauty", "nature", "nurturing", "abundance"], uprightMeaning: "Femininity, beauty, nature, nurturing, abundance, fertility", reversedMeaning: "Creative block, dependence on others, emptiness" },
  { name: "The Emperor", arcana: "major", number: 4, keywords: ["authority", "establishment", "structure", "father figure"], uprightMeaning: "Authority, establishment, structure, father figure", reversedMeaning: "Domination, excessive control, rigidity" },
  { name: "The Hierophant", arcana: "major", number: 5, keywords: ["spiritual wisdom", "tradition", "conformity", "institutions"], uprightMeaning: "Spiritual wisdom, religious beliefs, conformity, tradition", reversedMeaning: "Personal beliefs, freedom, challenging the status quo" },
  { name: "The Lovers", arcana: "major", number: 6, keywords: ["love", "harmony", "relationships", "values", "choices"], uprightMeaning: "Love, harmony, relationships, values alignment, choices", reversedMeaning: "Self-love, disharmony, imbalance, misaligned values" },
  { name: "The Chariot", arcana: "major", number: 7, keywords: ["control", "willpower", "success", "determination"], uprightMeaning: "Control, willpower, success, ambition, determination", reversedMeaning: "Self-discipline, opposition, lack of direction" },
  { name: "Strength", arcana: "major", number: 8, keywords: ["strength", "courage", "patience", "control", "compassion"], uprightMeaning: "Strength, courage, patience, control, compassion", reversedMeaning: "Inner strength, self-doubt, low energy, raw emotion" },
  { name: "The Hermit", arcana: "major", number: 9, keywords: ["soul-searching", "introspection", "inner guidance", "solitude"], uprightMeaning: "Soul-searching, introspection, being alone, inner guidance", reversedMeaning: "Isolation, loneliness, withdrawal" },
  { name: "Wheel of Fortune", arcana: "major", number: 10, keywords: ["good luck", "karma", "life cycles", "destiny", "turning point"], uprightMeaning: "Good luck, karma, life cycles, destiny, a turning point", reversedMeaning: "Bad luck, resistance to change, breaking cycles" },
  { name: "Justice", arcana: "major", number: 11, keywords: ["justice", "fairness", "truth", "cause and effect", "law"], uprightMeaning: "Justice, fairness, truth, cause and effect, law", reversedMeaning: "Unfairness, lack of accountability, dishonesty" },
  { name: "The Hanged Man", arcana: "major", number: 12, keywords: ["pause", "surrender", "letting go", "new perspectives"], uprightMeaning: "Pause, surrender, letting go, new perspectives", reversedMeaning: "Delays, resistance, stalling, indecision" },
  { name: "Death", arcana: "major", number: 13, keywords: ["endings", "change", "transformation", "transition"], uprightMeaning: "Endings, change, transformation, transition", reversedMeaning: "Resistance to change, personal transformation, inner purging" },
  { name: "Temperance", arcana: "major", number: 14, keywords: ["balance", "moderation", "patience", "purpose"], uprightMeaning: "Balance, moderation, patience, purpose, meaning", reversedMeaning: "Imbalance, excess, self-healing, re-alignment" },
  { name: "The Devil", arcana: "major", number: 15, keywords: ["shadow self", "attachment", "addiction", "restriction", "sexuality"], uprightMeaning: "Shadow self, attachment, addiction, restriction", reversedMeaning: "Releasing limiting beliefs, exploring dark thoughts, detachment" },
  { name: "The Tower", arcana: "major", number: 16, keywords: ["sudden change", "upheaval", "chaos", "revelation", "awakening"], uprightMeaning: "Sudden change, upheaval, chaos, revelation, awakening", reversedMeaning: "Personal transformation, fear of change, averting disaster" },
  { name: "The Star", arcana: "major", number: 17, keywords: ["hope", "faith", "purpose", "renewal", "spirituality"], uprightMeaning: "Hope, faith, purpose, renewal, spirituality", reversedMeaning: "Lack of faith, despair, self-trust, disconnection" },
  { name: "The Moon", arcana: "major", number: 18, keywords: ["illusion", "fear", "subconscious", "intuition"], uprightMeaning: "Illusion, fear, the subconscious, confusion, complexity", reversedMeaning: "Release of fear, repressed emotion, inner confusion" },
  { name: "The Sun", arcana: "major", number: 19, keywords: ["positivity", "fun", "warmth", "success", "vitality"], uprightMeaning: "Positivity, fun, warmth, success, vitality", reversedMeaning: "Inner child, feeling down, overly optimistic" },
  { name: "Judgement", arcana: "major", number: 20, keywords: ["judgement", "rebirth", "inner calling", "absolution"], uprightMeaning: "Judgement, rebirth, inner calling, absolution", reversedMeaning: "Self-doubt, inner critic, ignoring the call" },
  { name: "The World", arcana: "major", number: 21, keywords: ["completion", "integration", "accomplishment", "travel"], uprightMeaning: "Completion, integration, accomplishment, travel", reversedMeaning: "Seeking personal closure, short-cuts, delays" },
  // Cups
  { name: "Ace of Cups", arcana: "minor", suit: "Cups", keywords: ["love", "new feelings", "emotional awakening", "creativity"], uprightMeaning: "New feelings, emotional awakening, creativity, love", reversedMeaning: "Emotional loss, blocked creativity, emptiness" },
  { name: "Two of Cups", arcana: "minor", suit: "Cups", keywords: ["unity", "partnership", "mutual attraction", "connection"], uprightMeaning: "Unified love, partnership, mutual attraction", reversedMeaning: "Self-love, break-ups, disharmony" },
  { name: "Three of Cups", arcana: "minor", suit: "Cups", keywords: ["celebration", "friendship", "creativity", "community"], uprightMeaning: "Celebration, friendship, creativity, community", reversedMeaning: "Overindulgence, gossip, isolation" },
  { name: "Four of Cups", arcana: "minor", suit: "Cups", keywords: ["meditation", "contemplation", "apathy", "reevaluation"], uprightMeaning: "Meditation, contemplation, apathy, reevaluation", reversedMeaning: "Sudden awareness, choosing happiness, acceptance" },
  { name: "Five of Cups", arcana: "minor", suit: "Cups", keywords: ["regret", "failure", "disappointment", "pessimism"], uprightMeaning: "Regret, failure, disappointment, pessimism", reversedMeaning: "Personal setbacks, self-forgiveness, moving on" },
  { name: "Six of Cups", arcana: "minor", suit: "Cups", keywords: ["revisiting the past", "childhood memories", "innocence", "joy"], uprightMeaning: "Revisiting the past, childhood memories, innocence, joy", reversedMeaning: "Living in the past, forgiveness, lacking playfulness" },
  { name: "Seven of Cups", arcana: "minor", suit: "Cups", keywords: ["opportunities", "choices", "wishful thinking", "illusion"], uprightMeaning: "Opportunities, choices, wishful thinking, illusion", reversedMeaning: "Alignment, personal values, overwhelmed by choices" },
  { name: "Eight of Cups", arcana: "minor", suit: "Cups", keywords: ["disappointment", "abandonment", "withdrawal", "escapism"], uprightMeaning: "Disappointment, abandonment, withdrawal, escapism", reversedMeaning: "Trying one more time, indecision, aimless drifting" },
  { name: "Nine of Cups", arcana: "minor", suit: "Cups", keywords: ["contentment", "satisfaction", "gratitude", "wish come true"], uprightMeaning: "Contentment, satisfaction, gratitude, wish coming true", reversedMeaning: "Inner happiness, materialism, dissatisfaction" },
  { name: "Ten of Cups", arcana: "minor", suit: "Cups", keywords: ["divine love", "blissful relationships", "harmony", "alignment"], uprightMeaning: "Divine love, blissful relationships, harmony, alignment", reversedMeaning: "Disconnection, misaligned values, struggling relationships" },
  { name: "Page of Cups", arcana: "minor", suit: "Cups", keywords: ["creative opportunities", "intuitive messages", "curiosity", "possibility"], uprightMeaning: "Creative opportunities, intuitive messages, curiosity", reversedMeaning: "New idea, doubting intuition, creative blocks" },
  { name: "Knight of Cups", arcana: "minor", suit: "Cups", keywords: ["creativity", "romance", "charm", "imagination", "beauty"], uprightMeaning: "Creativity, romance, charm, imagination, beauty", reversedMeaning: "Overactive imagination, unrealistic, seduction" },
  { name: "Queen of Cups", arcana: "minor", suit: "Cups", keywords: ["compassionate", "caring", "emotionally stable", "intuitive"], uprightMeaning: "Compassionate, caring, emotionally stable, intuitive", reversedMeaning: "Inner feelings, self-care, self-love" },
  { name: "King of Cups", arcana: "minor", suit: "Cups", keywords: ["emotional balance", "generosity", "compassion", "diplomacy"], uprightMeaning: "Emotional balance, generosity, compassion, diplomatic", reversedMeaning: "Self-compassion, inner feelings, moodiness" },
  // Wands
  { name: "Ace of Wands", arcana: "minor", suit: "Wands", keywords: ["inspiration", "new opportunities", "growth", "potential"], uprightMeaning: "Inspiration, new opportunities, growth, potential", reversedMeaning: "An emerging idea, lack of direction, distractions" },
  { name: "Two of Wands", arcana: "minor", suit: "Wands", keywords: ["future planning", "progress", "decisions", "discovery"], uprightMeaning: "Future planning, progress, decisions, discovery", reversedMeaning: "Personal goals, inner alignment, fear of unknown" },
  { name: "Three of Wands", arcana: "minor", suit: "Wands", keywords: ["progress", "expansion", "foresight", "overseas opportunities"], uprightMeaning: "Progress, expansion, foresight, overseas opportunities", reversedMeaning: "Playing it safe, lack of foresight, unexpected delays" },
  { name: "Four of Wands", arcana: "minor", suit: "Wands", keywords: ["celebration", "joy", "harmony", "relaxation", "homecoming"], uprightMeaning: "Celebration, joy, harmony, relaxation, homecoming", reversedMeaning: "Personal celebration, inner harmony, conflict with others" },
  { name: "Five of Wands", arcana: "minor", suit: "Wands", keywords: ["disagreements", "competition", "tension", "conflict"], uprightMeaning: "Disagreements, competition, tension, conflict, diversity", reversedMeaning: "Inner conflict, conflict avoidance, tension release" },
  { name: "Six of Wands", arcana: "minor", suit: "Wands", keywords: ["success", "public recognition", "progress", "self-confidence"], uprightMeaning: "Success, public recognition, progress, self-confidence", reversedMeaning: "Private achievement, personal definition of success, fall from grace" },
  { name: "Seven of Wands", arcana: "minor", suit: "Wands", keywords: ["challenge", "competition", "protection", "perseverance"], uprightMeaning: "Challenge, competition, protection, perseverance", reversedMeaning: "Exhaustion, giving up, overwhelmed" },
  { name: "Eight of Wands", arcana: "minor", suit: "Wands", keywords: ["movement", "fast paced change", "action", "alignment"], uprightMeaning: "Movement, fast paced change, action, alignment, air travel", reversedMeaning: "Delays, frustration, resisting change, internal alignment" },
  { name: "Nine of Wands", arcana: "minor", suit: "Wands", keywords: ["resilience", "grit", "last stand", "persistence"], uprightMeaning: "Resilience, grit, last stand, persistence, test of faith", reversedMeaning: "Inner resources, struggle, overwhelm, defensive" },
  { name: "Ten of Wands", arcana: "minor", suit: "Wands", keywords: ["burden", "extra responsibility", "hard work", "completion"], uprightMeaning: "Burden, extra responsibility, hard work, completion", reversedMeaning: "Doing it all, carrying the burden, delegation" },
  { name: "Page of Wands", arcana: "minor", suit: "Wands", keywords: ["inspiration", "ideas", "discovery", "limitless potential"], uprightMeaning: "Inspiration, ideas, discovery, limitless potential", reversedMeaning: "Newly formed ideas, redirecting energy, self-limiting beliefs" },
  { name: "Knight of Wands", arcana: "minor", suit: "Wands", keywords: ["energy", "passion", "inspired action", "adventure"], uprightMeaning: "Energy, passion, inspired action, adventure, impulsiveness", reversedMeaning: "Passion project, haste, scattered energy, delays" },
  { name: "Queen of Wands", arcana: "minor", suit: "Wands", keywords: ["courage", "confidence", "independence", "social butterfly"], uprightMeaning: "Courage, confidence, independence, social butterfly", reversedMeaning: "Self-respect, self-confidence, introverted, re-establish sense of self" },
  { name: "King of Wands", arcana: "minor", suit: "Wands", keywords: ["natural-born leader", "vision", "entrepreneur", "honour"], uprightMeaning: "Natural-born leader, vision, entrepreneur, honour", reversedMeaning: "Impulsiveness, haste, ruthless, high expectations" },
  // Swords
  { name: "Ace of Swords", arcana: "minor", suit: "Swords", keywords: ["breakthrough", "clarity", "sharp mind", "truth"], uprightMeaning: "Breakthrough, clarity, sharp mind, cut through the confusion", reversedMeaning: "Inner clarity, re-thinking an idea, clouded judgement" },
  { name: "Two of Swords", arcana: "minor", suit: "Swords", keywords: ["difficult decisions", "weighing options", "indecision", "stalemate"], uprightMeaning: "Difficult decisions, weighing options, indecision, stalemate", reversedMeaning: "Indecision, confusion, information overload, no right choice" },
  { name: "Three of Swords", arcana: "minor", suit: "Swords", keywords: ["heartbreak", "emotional pain", "sorrow", "grief", "hurt"], uprightMeaning: "Heartbreak, emotional pain, sorrow, grief, hurt", reversedMeaning: "Negative self-talk, releasing pain, optimism, forgiveness" },
  { name: "Four of Swords", arcana: "minor", suit: "Swords", keywords: ["rest", "relaxation", "meditation", "contemplation"], uprightMeaning: "Rest, relaxation, meditation, contemplation, recuperation", reversedMeaning: "Exhaustion, burn-out, deep contemplation, stagnation" },
  { name: "Five of Swords", arcana: "minor", suit: "Swords", keywords: ["conflict", "disagreements", "competition", "defeat", "winning at all costs"], uprightMeaning: "Conflict, disagreements, competition, defeat, winning at all costs", reversedMeaning: "Reconciliation, making amends, past resentment" },
  { name: "Six of Swords", arcana: "minor", suit: "Swords", keywords: ["transition", "change", "rite of passage", "releasing baggage"], uprightMeaning: "Transition, change, rite of passage, releasing baggage", reversedMeaning: "Personal transition, resistance to change, unfinished business" },
  { name: "Seven of Swords", arcana: "minor", suit: "Swords", keywords: ["betrayal", "deception", "getting away with something", "strategic action"], uprightMeaning: "Betrayal, deception, getting away with something, acting strategically", reversedMeaning: "Imposter syndrome, self-deceit, keeping secrets" },
  { name: "Eight of Swords", arcana: "minor", suit: "Swords", keywords: ["negative thoughts", "self-imposed restriction", "imprisonment", "victim mentality"], uprightMeaning: "Negative thoughts, self-imposed restriction, imprisonment, victim mentality", reversedMeaning: "Self-limiting beliefs, inner critic, releasing negative thoughts" },
  { name: "Nine of Swords", arcana: "minor", suit: "Swords", keywords: ["anxiety", "worry", "fear", "depression", "nightmares"], uprightMeaning: "Anxiety, worry, fear, depression, nightmares", reversedMeaning: "Inner turmoil, deep-seated fears, secrets, releasing worry" },
  { name: "Ten of Swords", arcana: "minor", suit: "Swords", keywords: ["painful endings", "deep wounds", "betrayal", "loss"], uprightMeaning: "Painful endings, deep wounds, betrayal, loss, crisis", reversedMeaning: "Recovery, regeneration, resisting an inevitable end" },
  { name: "Page of Swords", arcana: "minor", suit: "Swords", keywords: ["new ideas", "curiosity", "thirst for knowledge", "new ways of communicating"], uprightMeaning: "New ideas, curiosity, thirst for knowledge, new ways of communicating", reversedMeaning: "Self-expression, all talk and no action, haphazard action" },
  { name: "Knight of Swords", arcana: "minor", suit: "Swords", keywords: ["ambitious", "action-oriented", "driven to succeed", "fast-thinking"], uprightMeaning: "Ambitious, action-oriented, driven, fast-thinking", reversedMeaning: "Restless, unfocused, impulsive, burn-out" },
  { name: "Queen of Swords", arcana: "minor", suit: "Swords", keywords: ["independent", "unbiased judgement", "clear boundaries", "direct communication"], uprightMeaning: "Independent, unbiased judgement, clear boundaries, direct", reversedMeaning: "Overly-emotional, easily influenced, bitchy, cold-hearted" },
  { name: "King of Swords", arcana: "minor", suit: "Swords", keywords: ["mental clarity", "intellectual power", "authority", "truth"], uprightMeaning: "Mental clarity, intellectual power, authority, truth", reversedMeaning: "Quiet power, inner truth, misuse of power, manipulation" },
  // Pentacles
  { name: "Ace of Pentacles", arcana: "minor", suit: "Pentacles", keywords: ["new financial opportunity", "manifestation", "abundance"], uprightMeaning: "New financial opportunity, manifestation, abundance", reversedMeaning: "Lost opportunity, lack of planning and foresight" },
  { name: "Two of Pentacles", arcana: "minor", suit: "Pentacles", keywords: ["multiple priorities", "time management", "prioritisation", "adaptability"], uprightMeaning: "Multiple priorities, time management, prioritisation, adaptability", reversedMeaning: "Over-committed, disorganisation, reprioritisation" },
  { name: "Three of Pentacles", arcana: "minor", suit: "Pentacles", keywords: ["teamwork", "collaboration", "learning", "implementation"], uprightMeaning: "Teamwork, collaboration, learning, implementation", reversedMeaning: "Disharmony, misalignment, working alone" },
  { name: "Four of Pentacles", arcana: "minor", suit: "Pentacles", keywords: ["saving money", "security", "conservatism", "scarcity"], uprightMeaning: "Saving money, security, conservatism, scarcity, control", reversedMeaning: "Over-spending, greed, self-protection" },
  { name: "Five of Pentacles", arcana: "minor", suit: "Pentacles", keywords: ["financial loss", "poverty", "lack mindset", "isolation"], uprightMeaning: "Financial loss, poverty, lack mindset, isolation, worry about money", reversedMeaning: "Recovery from financial loss, spiritual poverty" },
  { name: "Six of Pentacles", arcana: "minor", suit: "Pentacles", keywords: ["giving", "receiving", "sharing wealth", "generosity", "charity"], uprightMeaning: "Giving, receiving, sharing wealth, generosity, charity", reversedMeaning: "Self-care, unpaid debts, one-sided charity" },
  { name: "Seven of Pentacles", arcana: "minor", suit: "Pentacles", keywords: ["long-term view", "sustainable results", "perseverance", "investment"], uprightMeaning: "Long-term view, sustainable results, perseverance, investment", reversedMeaning: "Lack of long-term vision, limited success or reward" },
  { name: "Eight of Pentacles", arcana: "minor", suit: "Pentacles", keywords: ["apprenticeship", "repetitive tasks", "mastery", "skill development"], uprightMeaning: "Apprenticeship, repetitive tasks, mastery, skill development", reversedMeaning: "Self-development, perfectionism, misdirected activity" },
  { name: "Nine of Pentacles", arcana: "minor", suit: "Pentacles", keywords: ["abundance", "luxury", "self-sufficiency", "financial independence"], uprightMeaning: "Abundance, luxury, self-sufficiency, financial independence", reversedMeaning: "Self-worth, over-investment in work, hustling" },
  { name: "Ten of Pentacles", arcana: "minor", suit: "Pentacles", keywords: ["wealth", "financial security", "family", "long-term success"], uprightMeaning: "Wealth, financial security, family, long-term success, contribution", reversedMeaning: "The dark side of wealth, financial failure or loss" },
  { name: "Page of Pentacles", arcana: "minor", suit: "Pentacles", keywords: ["manifestation", "financial opportunity", "skill development"], uprightMeaning: "Manifestation, financial opportunity, skill development", reversedMeaning: "Lack of progress, procrastination, learn from failure" },
  { name: "Knight of Pentacles", arcana: "minor", suit: "Pentacles", keywords: ["hard work", "productivity", "routine", "conservatism"], uprightMeaning: "Hard work, productivity, routine, conservatism", reversedMeaning: "Self-discipline, boredom, feeling stuck, perfectionism" },
  { name: "Queen of Pentacles", arcana: "minor", suit: "Pentacles", keywords: ["nurturing", "practical", "providing financially", "a working parent"], uprightMeaning: "Nurturing, practical, providing financially, a working parent", reversedMeaning: "Financial independence, self-care, work-home conflict" },
  { name: "King of Pentacles", arcana: "minor", suit: "Pentacles", keywords: ["wealth", "business", "leadership", "security", "discipline"], uprightMeaning: "Wealth, business, leadership, security, discipline, abundance", reversedMeaning: "Financially inept, obsessed with wealth and status, stubborn" },
]

export type SpreadType = {
  name: string
  description: string
  positions: string[]
  bestFor: string[]
}

export const SPREADS: SpreadType[] = [
  {
    name: "The Single Card",
    description: "One card for a focused insight",
    positions: ["Your answer"],
    bestFor: ["quick guidance", "yes/no questions", "daily reflection"],
  },
  {
    name: "Past, Present, Future",
    description: "Three cards tracing the arc of your situation",
    positions: ["What was", "What is", "What is becoming"],
    bestFor: ["understanding a situation", "relationships", "career moves", "general guidance"],
  },
  {
    name: "The Heart's Truth",
    description: "Four cards for matters of love and connection",
    positions: ["Your heart", "Their heart", "What connects you", "What the universe wishes for you"],
    bestFor: ["love questions", "relationships", "romantic decisions"],
  },
  {
    name: "The Crossroads",
    description: "Five cards for decisions and turning points",
    positions: ["Where you stand", "What pulls you left", "What pulls you right", "What you fear", "What will guide you"],
    bestFor: ["big decisions", "life changes", "feeling stuck", "choosing a path"],
  },
  {
    name: "The Mirror",
    description: "Three cards to see yourself more clearly",
    positions: ["Who you are now", "What you cannot see about yourself", "Your greatest strength in this moment"],
    bestFor: ["self-discovery", "personal growth", "understanding yourself"],
  },
  {
    name: "The Shadow and Light",
    description: "Six cards exploring deeper patterns",
    positions: ["Your conscious desire", "Your hidden fear", "The obstacle", "The resource you already have", "The lesson", "The invitation"],
    bestFor: ["complex situations", "recurring patterns", "deep healing", "spiritual guidance"],
  },
  {
    name: "The Seven Stars",
    description: "Seven cards for a full reading",
    positions: ["The past", "The present", "Hidden influences", "What you bring", "What stands in the way", "What is possible", "The outcome"],
    bestFor: ["seven card", "7 card", "full reading", "deep dive"],
  },
  {
    name: "The Celtic Cross",
    description: "Ten cards — the complete picture",
    positions: ["The situation", "What crosses you", "The root", "The recent past", "What crowns you", "What's coming", "Your position", "Outside forces", "Hopes and fears", "The outcome"],
    bestFor: ["ten card", "10 card", "celtic cross", "complete reading", "everything"],
  },
]

export function drawCards(count: number): TarotCard[] {
  const shuffled = [...TAROT_DECK].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function chooseSpreadsForConcern(concern: string): SpreadType {
  const lower = concern.toLowerCase()

  // Explicit card count requests always win
  if (/\b(10|ten)\s*card/.test(lower) || lower.includes("celtic cross")) return SPREADS[7]
  if (/\b(7|seven)\s*card/.test(lower)) return SPREADS[6]
  if (/\b(6|six)\s*card/.test(lower)) return SPREADS[5]
  if (/\b(5|five)\s*card/.test(lower)) return SPREADS[3]
  if (/\b(4|four)\s*card/.test(lower)) return SPREADS[2]
  if (/\b(3|three)\s*card/.test(lower)) return SPREADS[1]
  if (/\b(1|one)\s*card/.test(lower) || lower.includes("single card") || lower.includes("one card")) return SPREADS[0]

  // Topic-based selection
  if (lower.includes("love") || lower.includes("relationship") || lower.includes("partner") || lower.includes("heart") || lower.includes("dating") || lower.includes("marriage")) {
    return SPREADS[2] // Heart's Truth
  }
  if (lower.includes("decision") || lower.includes("choose") || lower.includes("stuck") || lower.includes("path") || lower.includes("should i") || lower.includes("career") || lower.includes("job") || lower.includes("move")) {
    return SPREADS[3] // Crossroads
  }
  if (lower.includes("myself") || lower.includes("who am i") || lower.includes("understand") || lower.includes("identity") || lower.includes("purpose")) {
    return SPREADS[4] // Mirror
  }
  if (lower.includes("pattern") || lower.includes("keep") || lower.includes("always") || lower.includes("trauma") || lower.includes("heal") || lower.includes("shadow")) {
    return SPREADS[5] // Shadow and Light
  }
  if (lower.length < 30) return SPREADS[0]
  return SPREADS[1]
}
