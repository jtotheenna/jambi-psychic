// Moon phase calculation using astronomical algorithms
// No external API needed — pure math from known lunar cycle constants

export type MoonPhase =
  | "New Moon"
  | "Waxing Crescent"
  | "First Quarter"
  | "Waxing Gibbous"
  | "Full Moon"
  | "Waning Gibbous"
  | "Last Quarter"
  | "Waning Crescent"

export type SunBearMoon = {
  name: string
  totem: string
  element: string
  clan: string
  path: string
  dates: string
  energy: string
  number: number
}

// Sun Bear's Earth Astrology — 13 moons of the Medicine Wheel
// From "The Medicine Wheel: Earth Astrology" (Bear Tribe Medicine Society)
export const SUN_BEAR_MOONS: SunBearMoon[] = [
  {
    number: 1,
    name: "Earth Renewal Moon",
    totem: "Snow Goose",
    element: "Earth",
    clan: "Turtle Clan",
    path: "Red Path of Life Growth",
    dates: "Dec 22 – Jan 19",
    energy: "A time of stillness, reflection, and honoring what has been. The earth sleeps but dreams deeply. This is the moon of fresh starts that grow in the dark before the light.",
  },
  {
    number: 2,
    name: "Rest and Cleansing Moon",
    totem: "Otter",
    element: "Air",
    clan: "Butterfly Clan",
    path: "Red Path of Purification",
    dates: "Jan 20 – Feb 18",
    energy: "Purification and play. The otter moves through frozen water without fear. A time to release what no longer serves and to find unexpected joy in difficult conditions.",
  },
  {
    number: 3,
    name: "Big Winds Moon",
    totem: "Cougar",
    element: "Air",
    clan: "Butterfly Clan",
    path: "Red Path of Purification",
    dates: "Feb 19 – Mar 20",
    energy: "The winds bring change and dissolve what is stagnant. The cougar moves with total certainty. A time of spiritual power, endings that make way, and fearless intuition.",
  },
  {
    number: 4,
    name: "Budding Trees Moon",
    totem: "Red Hawk",
    element: "Fire",
    clan: "Hawk Clan",
    path: "Black Path of Enlightenment",
    dates: "Mar 21 – Apr 19",
    energy: "The first fire of spring. The hawk sees from great heights and acts with precision. A time of new vision, courageous beginnings, and clarity after long confusion.",
  },
  {
    number: 5,
    name: "Frogs Return Moon",
    totem: "Beaver",
    element: "Earth",
    clan: "Turtle Clan",
    path: "Red Path of Life Growth",
    dates: "Apr 20 – May 20",
    energy: "The earth opens and the rains come. The beaver builds with patience and purpose. A time to lay foundations, tend to practical matters, and trust the slow work.",
  },
  {
    number: 6,
    name: "Cornplanting Moon",
    totem: "Deer",
    element: "Air",
    clan: "Butterfly Clan",
    path: "Red Path of Life Growth",
    dates: "May 21 – Jun 20",
    energy: "The planting time — seeds go into the earth with intention. The deer moves gently but knows the way. A time of communication, planting what you want to harvest.",
  },
  {
    number: 7,
    name: "Strong Sun Moon",
    totem: "Flicker",
    element: "Fire",
    clan: "Hawk Clan",
    path: "Black Path of Enlightenment",
    dates: "Jun 21 – Jul 22",
    energy: "The sun is at its peak power. The flicker drums on the tree, calling for healing. A time of love, emotion, family, memory, and the deep currents beneath the surface.",
  },
  {
    number: 8,
    name: "Ripe Berries Moon",
    totem: "Sturgeon",
    element: "Water",
    clan: "Frog Clan",
    path: "Black Path of Enlightenment",
    dates: "Jul 23 – Aug 22",
    energy: "The great depth-swimmer. The sturgeon lives long and knows the ancient waters. A time of personal power, generosity, leadership, and bringing gifts fully forward.",
  },
  {
    number: 9,
    name: "Harvest Moon",
    totem: "Brown Bear",
    element: "Earth",
    clan: "Turtle Clan",
    path: "Red Path of Purification",
    dates: "Aug 23 – Sep 22",
    energy: "The harvest is gathered and examined. The bear prepares with wisdom and discernment. A time of practical analysis, separating what is useful from what is not.",
  },
  {
    number: 10,
    name: "Ducks Fly Moon",
    totem: "Raven",
    element: "Air",
    clan: "Butterfly Clan",
    path: "Black Path of Enlightenment",
    dates: "Sep 23 – Oct 23",
    energy: "The raven holds all paradox without flinching. Balance, justice, and seeing both sides of everything. A time when the scales must be honored — what is fair, what is true.",
  },
  {
    number: 11,
    name: "Freeze Up Moon",
    totem: "Snake",
    element: "Water",
    clan: "Frog Clan",
    path: "Red Path of Purification",
    dates: "Oct 24 – Nov 21",
    energy: "The snake sheds and transforms. The earth begins to freeze and the veil thins. A time of deep transformation, of letting the old skin go, of honoring what lies beyond.",
  },
  {
    number: 12,
    name: "Long Snows Moon",
    totem: "Elk",
    element: "Earth",
    clan: "Turtle Clan",
    path: "Black Path of Enlightenment",
    dates: "Nov 22 – Dec 21",
    energy: "The elk moves through deep snow with endurance and nobility. The long dark asks for stamina, for honoring community, for giving generously even when resources are low.",
  },
  {
    number: 13,
    name: "The Center Moon",
    totem: "Yanu the Bear — Buffalo of the White Cleansing Wind",
    element: "All elements",
    clan: "All clans",
    path: "All paths — the still point of the wheel",
    dates: "The 13th moon — when the calendar turns",
    energy: "The Great Mystery at the center of the wheel. All paths converge here. This is the moon of profound transition — when one cycle completes and the next has not yet begun.",
  },
]

// Get current Sun Bear moon based on date
export function getCurrentSunBearMoon(date: Date = new Date()): SunBearMoon {
  const month = date.getMonth() + 1 // 1-12
  const day = date.getDate()

  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return SUN_BEAR_MOONS[0]
  if (month === 1 && day >= 20 || month === 2 && day <= 18) return SUN_BEAR_MOONS[1]
  if (month === 2 && day >= 19 || month === 3 && day <= 20) return SUN_BEAR_MOONS[2]
  if (month === 3 && day >= 21 || month === 4 && day <= 19) return SUN_BEAR_MOONS[3]
  if (month === 4 && day >= 20 || month === 5 && day <= 20) return SUN_BEAR_MOONS[4]
  if (month === 5 && day >= 21 || month === 6 && day <= 20) return SUN_BEAR_MOONS[5]
  if (month === 6 && day >= 21 || month === 7 && day <= 22) return SUN_BEAR_MOONS[6]
  if (month === 7 && day >= 23 || month === 8 && day <= 22) return SUN_BEAR_MOONS[7]
  if (month === 8 && day >= 23 || month === 9 && day <= 22) return SUN_BEAR_MOONS[8]
  if (month === 9 && day >= 23 || month === 10 && day <= 23) return SUN_BEAR_MOONS[9]
  if (month === 10 && day >= 24 || month === 11 && day <= 21) return SUN_BEAR_MOONS[10]
  if (month === 11 && day >= 22 || month === 12 && day <= 21) return SUN_BEAR_MOONS[11]
  return SUN_BEAR_MOONS[0]
}

// Astronomical moon phase calculation
// Mean synodic period (Jean Meeus, "Astronomical Algorithms" Ch. 47)
const SYNODIC_MS = 29.530588861 * 24 * 60 * 60 * 1000

// Verified reference new moons — USNO Astronomical Almanac + NASA eclipse center.
// Using multiple anchors and picking the closest one minimises accumulated mean-period error.
const NEW_MOON_ANCHORS: number[] = [
  new Date("2000-01-06T18:14:00Z").getTime(), // USNO J2000 reference
  new Date("2024-04-08T18:21:00Z").getTime(), // Total solar eclipse (NASA)
  new Date("2024-10-02T18:49:00Z").getTime(), // Annular solar eclipse (NASA)
  new Date("2025-01-29T12:36:00Z").getTime(), // USNO 2025 almanac
  new Date("2025-05-27T03:02:00Z").getTime(), // USNO 2025 almanac
  new Date("2025-09-21T19:54:00Z").getTime(), // USNO 2025 almanac
  new Date("2026-01-18T19:51:00Z").getTime(), // USNO 2026 almanac
  new Date("2026-05-16T20:01:00Z").getTime(), // USNO 2026 almanac
  new Date("2026-09-11T03:27:00Z").getTime(), // USNO 2026 almanac
  new Date("2027-01-07T20:24:00Z").getTime(), // USNO 2027 almanac
]

// Returns the cycle fraction [0,1) using the closest past anchor for best accuracy.
function moonFraction(date: Date): number {
  const now = date.getTime()
  // Find anchors that are in the past, pick the one with fewest elapsed cycles
  // (= least accumulated mean-period drift)
  let bestFrac = -1
  let bestCycles = Infinity
  for (const anchor of NEW_MOON_ANCHORS) {
    if (anchor > now) continue
    const elapsed = now - anchor
    const totalCycles = elapsed / SYNODIC_MS
    const completeCycles = Math.floor(totalCycles)
    if (completeCycles < bestCycles) {
      bestCycles = completeCycles
      bestFrac = totalCycles - completeCycles
    }
  }
  // Fallback if somehow all anchors are in the future (shouldn't happen)
  if (bestFrac < 0) {
    const elapsed = now - NEW_MOON_ANCHORS[0]
    const f = ((elapsed % SYNODIC_MS) + SYNODIC_MS) % SYNODIC_MS / SYNODIC_MS
    return f
  }
  return bestFrac
}

export type MoonData = {
  phase: MoonPhase
  illumination: number      // 0-100 percent
  dayOfCycle: number        // 1-30
  daysToFull: number | null // null if past full
  daysToNew: number | null
  sunBearMoon: SunBearMoon
  phaseEmoji: string
}

export function getMoonData(date: Date = new Date()): MoonData {
  const fraction = moonFraction(date)

  const dayOfCycle = Math.floor(fraction * 29.53) + 1
  const illumination = Math.round((1 - Math.cos(fraction * 2 * Math.PI)) / 2 * 100)

  // Phase windows are centred on the exact moments (0, 0.25, 0.5, 0.75).
  // Each named phase gets a ±2.5-day window (~0.085 of cycle) so short-lived
  // transitions are still correctly named rather than defaulting to a crescent/gibbous.
  let phase: MoonPhase
  let phaseEmoji: string
  if (fraction < 0.0423 || fraction >= 0.9577) { phase = "New Moon";        phaseEmoji = "🌑" }
  else if (fraction < 0.2077)                  { phase = "Waxing Crescent"; phaseEmoji = "🌒" }
  else if (fraction < 0.2923)                  { phase = "First Quarter";   phaseEmoji = "🌓" }
  else if (fraction < 0.4577)                  { phase = "Waxing Gibbous";  phaseEmoji = "🌔" }
  else if (fraction < 0.5423)                  { phase = "Full Moon";       phaseEmoji = "🌕" }
  else if (fraction < 0.7077)                  { phase = "Waning Gibbous";  phaseEmoji = "🌖" }
  else if (fraction < 0.7923)                  { phase = "Last Quarter";    phaseEmoji = "🌗" }
  else                                         { phase = "Waning Crescent"; phaseEmoji = "🌘" }

  const daysToFull = fraction < 0.5
    ? Math.round((0.5 - fraction) * 29.53)
    : null
  const daysToNew = fraction < 0.9577
    ? Math.round((1 - fraction) * 29.53)
    : 0

  return {
    phase,
    illumination,
    dayOfCycle,
    daysToFull,
    daysToNew,
    sunBearMoon: getCurrentSunBearMoon(date),
    phaseEmoji,
  }
}
