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
    positions: ["Your answer"],
    description: "One card for a focused insight",
    bestFor: ["1 card", "one card", "daily", "quick", "yes or no"],
  },
  {
    name: "The Two Paths",
    positions: ["What is", "What could be"],
    description: "Two cards showing where you are and where you could go",
    bestFor: ["2 card", "two card"],
  },
  {
    name: "The Mirror",
    positions: ["What you show the world", "What is actually true underneath"],
    description: "Two cards for self-honesty — the mask and what's beneath it",
    bestFor: ["fooling myself", "honest", "truth", "denial", "really happening"],
  },
  {
    name: "Past, Present, Future",
    positions: ["What was", "What is", "What is becoming"],
    description: "The arc of your situation",
    bestFor: ["3 card", "three card", "past present future", "general guidance"],
  },
  {
    name: "The Threshold",
    positions: ["What you are leaving behind", "Where you stand right now", "What you are stepping into"],
    description: "Three cards for transition — not past/present/future but the crossing itself",
    bestFor: ["transition", "change", "moving on", "leaving", "new chapter", "ending", "beginning"],
  },
  {
    name: "The Heart's Truth",
    positions: ["Your heart", "Their heart", "What connects you", "What the universe wishes for you"],
    description: "Four cards for love and connection",
    bestFor: ["4 card", "four card", "love", "relationship", "partner", "romance"],
  },
  {
    name: "The Wound and Gift",
    positions: ["The wound", "How it shows up in your life", "The gift hidden inside it", "How to use it"],
    description: "Four cards for healing — the pain and what it's actually giving you",
    bestFor: ["healing", "hurt", "pain", "pattern", "keep happening", "why do i", "trauma", "wound"],
  },
  {
    name: "The Body of the Question",
    positions: ["The head — what you think", "The heart — what you feel", "The gut — what you know", "The hands — what to do", "The feet — where to go"],
    description: "Five cards for when head and heart are at war",
    bestFor: ["torn", "head and heart", "don't know what i want", "confused", "conflicted", "overthinking"],
  },
  {
    name: "The Crossroads",
    positions: ["Where you stand", "What pulls you left", "What pulls you right", "What you fear", "What will guide you"],
    description: "Five cards for decisions",
    bestFor: ["5 card", "five card", "decision", "choice", "crossroads", "stuck"],
  },
  {
    name: "The Root and the Reach",
    positions: ["What grounds you", "What you are reaching for", "What blocks the distance between them", "What feeds you", "What is calling you", "What is already yours"],
    description: "Six cards for feeling stuck — what holds you and what pulls you forward",
    bestFor: ["stuck", "can't move", "blocked", "frustrated", "stagnant", "not moving", "what's holding me"],
  },
  {
    name: "The Shadow and Light",
    positions: ["Your conscious desire", "Your hidden fear", "The obstacle", "The resource you have", "The lesson", "The invitation"],
    description: "Six cards exploring deeper patterns",
    bestFor: ["6 card", "six card", "pattern", "heal", "shadow", "trauma"],
  },
  {
    name: "The Seven Stars",
    positions: ["The past", "The present", "Hidden influences", "What you bring", "What stands in the way", "What is possible", "The outcome"],
    description: "Seven cards — a complete arc",
    bestFor: ["7 card", "seven card"],
  },
  {
    name: "The Horseshoe",
    positions: ["The past", "The present", "Hidden influences", "The near future", "External influences", "Hopes and fears", "The likely outcome", "What to do"],
    description: "Eight cards — the horseshoe spread",
    bestFor: ["8 card", "eight card", "horseshoe"],
  },
  {
    name: "The Three Worlds",
    positions: ["The physical situation", "The emotional truth", "The spiritual message", "What was", "What is", "What is coming", "The hidden factor", "What you need", "The final word"],
    description: "Nine cards — mind, body, spirit across time",
    bestFor: ["9 card", "nine card"],
  },
  {
    name: "The Celtic Cross",
    positions: ["The situation", "What crosses you", "The root cause", "The recent past", "What crowns you", "What is coming", "Your position", "Outside forces", "Hopes and fears", "The outcome"],
    description: "Ten cards — the complete picture",
    bestFor: ["10 card", "ten card", "celtic cross", "complete reading"],
  },
  {
    name: "The Year Ahead",
    positions: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    description: "Twelve cards — one for each month",
    bestFor: ["12 card", "twelve card", "year", "year ahead", "months"],
  },
  {
    name: "The Full Spread",
    positions: ["The foundation", "The recent past", "The present moment", "Hidden influences", "Your conscious goal", "The near future", "Your inner state", "External environment", "Hopes and fears", "The likely outcome", "What you bring", "What stands in your way", "The final word"],
    description: "Thirteen cards — a complete reading",
    bestFor: ["13 card", "thirteen card", "full spread", "everything"],
  },
]

// Grid layout: [col, row] — 1-indexed. null = skip that position.
export type SpreadLayout = { col: number; row: number; rotate?: boolean }[]

export const SPREAD_LAYOUTS: Record<string, SpreadLayout> = {
  "The Single Card":       [{ col: 1, row: 1 }],
  "The Two Paths":         [{ col: 1, row: 1 }, { col: 2, row: 1 }],
  "Past, Present, Future": [{ col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }],
  "The Heart's Truth":     [{ col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }, { col: 4, row: 1 }],
  "The Crossroads": [
    { col: 2, row: 1 }, // Where you stand
    { col: 1, row: 2 }, // Pulls left
    { col: 3, row: 2 }, // Pulls right
    { col: 2, row: 3 }, // Fear
    { col: 2, row: 2 }, // Guide (center)
  ],
  "The Shadow and Light": [
    { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 },
    { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 },
  ],
  "The Seven Stars": [
    { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }, { col: 4, row: 1 },
    { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 },
  ],
  "The Horseshoe": [
    { col: 1, row: 2 }, { col: 2, row: 1 }, { col: 3, row: 1 },
    { col: 4, row: 1 }, { col: 5, row: 1 }, { col: 6, row: 1 },
    { col: 7, row: 2 }, { col: 4, row: 2 },
  ],
  "The Celtic Cross": [
    { col: 2, row: 2 }, // Situation
    { col: 2, row: 2, rotate: true }, // Crosses (overlaid)
    { col: 2, row: 3 }, // Root
    { col: 1, row: 2 }, // Recent past
    { col: 2, row: 1 }, // What crowns
    { col: 3, row: 2 }, // Coming
    { col: 5, row: 4 }, // Your position
    { col: 5, row: 3 }, // Outside
    { col: 5, row: 2 }, // Hopes/fears
    { col: 5, row: 1 }, // Outcome
  ],
}

export function getSpreadLayout(spreadName: string | null): SpreadLayout | null {
  if (!spreadName) return null
  return SPREAD_LAYOUTS[spreadName] || null
}

export function drawCards(count: number): TarotCard[] {
  const deck = [...TAROT_DECK]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck.slice(0, count)
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
}

export function chooseSpreadsForConcern(concern: string): SpreadType {
  const lower = concern.toLowerCase()

  // Explicit card count — numeric or word
  const numMatch = lower.match(/\b(\d+)\s*card/)
  if (numMatch) {
    const n = parseInt(numMatch[1])
    const match = SPREADS.find((s) => s.positions.length === n)
    if (match) return match
    // Closest spread
    return SPREADS.reduce((a, b) =>
      Math.abs(a.positions.length - n) <= Math.abs(b.positions.length - n) ? a : b
    )
  }

  // Word numbers
  for (const [word, n] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(`\\b${word}\\s*card`).test(lower)) {
      const match = SPREADS.find((s) => s.positions.length === n)
      if (match) return match
    }
  }

  // Named spreads
  if (lower.includes("celtic cross")) return SPREADS.find(s => s.name === "The Celtic Cross")!
  if (lower.includes("horseshoe"))   return SPREADS.find(s => s.name === "The Horseshoe")!
  if (lower.includes("year"))        return SPREADS.find(s => s.name === "The Year Ahead")!
  if (lower.includes("full spread") || lower.includes("everything") || lower.includes("full reading")) {
    return SPREADS.find(s => s.name === "The Full Spread")!
  }

  // Topic-based
  if (lower.includes("love") || lower.includes("relationship") || lower.includes("partner") || lower.includes("dating") || lower.includes("marriage") || lower.includes("my heart") || lower.includes("crush") || lower.includes("ex ") || lower.includes(" ex ")) {
    return SPREADS.find(s => s.name === "The Heart's Truth")!
  }
  if (lower.includes("decision") || lower.includes("choose") || lower.includes("stuck") || lower.includes("path") || lower.includes("should i") || lower.includes("career")) {
    return SPREADS.find(s => s.name === "The Crossroads")!
  }
  if (lower.includes("pattern") || lower.includes("trauma") || lower.includes("heal") || lower.includes("shadow")) {
    return SPREADS.find(s => s.name === "The Shadow and Light")!
  }

  // Default: Celtic Cross — full reading, give them a real spread
  return SPREADS.find(s => s.name === "The Celtic Cross")!
}
