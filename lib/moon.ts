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
  teaching?: string  // the inner-ring concept this moon carries
}

// Your Medicine Wheel — 13 moons
// Keepers: Yanu (Bear, Black) holds 1-3 · Yunsu (Buffalo, White) holds 4-6
//          Awahili (Eagle, Red) holds 7-9 · Tsistu (Rabbit, Green) holds 10-12
//          Yunsu the Great White Giant holds the center
export const SUN_BEAR_MOONS: SunBearMoon[] = [
  {
    number: 1,
    name: "Icicle Moon",
    totem: "Yanu the Bear",
    element: "Earth",
    clan: "Bear Clan",
    path: "Black Path of Enlightenment",
    dates: "Dec 22 – Jan 19",
    teaching: "Purity",
    energy: "The world is frozen and still — and that stillness is the teaching. Yanu the Bear holds these winter moons with quiet strength. This is the moon of going inward, of resting in the dark before the slow return of light. Purity begins here, in the silence under the ice.",
  },
  {
    number: 2,
    name: "Frost Moon",
    totem: "Yanu the Bear",
    element: "Earth",
    clan: "Bear Clan",
    path: "Black Path of Lessons",
    dates: "Jan 20 – Feb 18",
    teaching: "Strength",
    energy: "The frost holds the land in place while lessons crystallize beneath the surface. Yanu watches from the cave. This moon asks what you have been avoiding knowing. The cold is a teacher — it strips away comfort and leaves only what is essential and true.",
  },
  {
    number: 3,
    name: "Thawing Moon",
    totem: "Yanu the Bear",
    element: "Water",
    clan: "Bear Clan",
    path: "Red Path of Purification",
    dates: "Feb 19 – Mar 20",
    teaching: "Cleansing",
    energy: "The first thaw begins its slow and certain work. What was frozen loosens. Yanu emerges from the long winter carrying everything that was learned in the dark. This is the moon of purification — releasing what the cold preserved so the new can begin to move.",
  },
  {
    number: 4,
    name: "Flower Moon",
    totem: "Yunsu the Buffalo",
    element: "Earth",
    clan: "Buffalo Clan",
    path: "Red Path of Purification",
    dates: "Mar 21 – Apr 19",
    energy: "Yunsu the Buffalo carries the cleansing wind of spring. The first flowers push through — tender, precise, inevitable. This moon belongs to renewal and the courage of things that bloom before the frost is fully gone. A time for beginning what has waited long enough.",
  },
  {
    number: 5,
    name: "Mockingbird Moon",
    totem: "Yunsu the Buffalo",
    element: "Air",
    clan: "Buffalo Clan",
    path: "Red Path of Life & Growth",
    dates: "Apr 20 – May 20",
    energy: "The mockingbird sings every song it knows — freely, abundantly, without holding back. Yunsu walks the red path of life and growth. This moon asks you to find your voice, to try what you have only watched others do, to bring everything you carry into full expression.",
  },
  {
    number: 6,
    name: "Dogwood Moon",
    totem: "Yunsu the Buffalo",
    element: "Fire",
    clan: "Buffalo Clan",
    path: "Red Path of Life & Growth",
    dates: "May 21 – Jun 20",
    energy: "The dogwood blooms white and deliberate against the green. Yunsu the Buffalo stands at the center of the growing season. This is the moon of full emergence — what you planted is showing itself now. Truth, love, and growth all ask to be tended with steady hands.",
  },
  {
    number: 7,
    name: "Hawk Moon",
    totem: "Awahili the Eagle",
    element: "Fire",
    clan: "Eagle Clan",
    path: "Black Path of Enlightenment",
    dates: "Jun 21 – Jul 22",
    energy: "The hawk circles at the peak of summer with total clarity — it does not search, it sees. Awahili the Eagle holds these high-sun moons with precision and wide vision. This moon of illumination asks what you have been refusing to look at directly. The hawk never looks away.",
  },
  {
    number: 8,
    name: "Sassafras Moon",
    totem: "Awahili the Eagle",
    element: "Water",
    clan: "Eagle Clan",
    path: "Black Path of Lessons",
    dates: "Jul 23 – Aug 22",
    energy: "Sassafras is a root medicine — bitter, aromatic, deep. Awahili walks the lesson path in late summer when the land is rich but the heat teaches endurance. This moon asks what medicine you have been sitting with that you have not yet let work. Some healing is slow and cannot be rushed.",
  },
  {
    number: 9,
    name: "Squirrel Moon",
    totem: "Awahili the Eagle",
    element: "Earth",
    clan: "Eagle Clan",
    path: "Red Path of Purification",
    dates: "Aug 23 – Sep 22",
    energy: "The squirrel reads the air and begins to prepare. Awahili oversees the harvest of wisdom from the long summer. This moon of purification asks what is worth keeping and what must be left behind — the squirrel knows exactly what it needs and where to put it.",
  },
  {
    number: 10,
    name: "Birds Fly Moon",
    totem: "Tsistu the Rabbit",
    element: "Air",
    clan: "Rabbit Clan",
    path: "Red Path of Life & Growth",
    dates: "Sep 23 – Oct 23",
    energy: "The birds know when to leave and they go without ceremony. Tsistu the Rabbit — the trickster who always faces the direction we are moving — keeps these fall moons. This is the moon of necessary departure. What needs to migrate out of your life is already lifting its wings.",
  },
  {
    number: 11,
    name: "Woodchuck Moon",
    totem: "Tsistu the Rabbit",
    element: "Earth",
    clan: "Rabbit Clan",
    path: "Black Path of Lessons",
    dates: "Oct 24 – Nov 21",
    energy: "The woodchuck goes deep and trusts the earth to hold it through the dark. Tsistu walks the path of lessons with quick ears and quick feet. This moon asks what is worth protecting, what deserves the warmth of your deepest shelter, and what you are willing to wait out.",
  },
  {
    number: 12,
    name: "Long Sleep Moon",
    totem: "Tsistu the Rabbit",
    element: "Water",
    clan: "Rabbit Clan",
    path: "Red Path of Purification",
    dates: "Nov 22 – Dec 21",
    energy: "The long sleep comes. Tsistu, the trickster who always points the way forward, hands the wheel back to Yanu as the cycle closes. This moon of purification asks you to lay down what you carried all year — to enter the dark season clean, ready, and without argument.",
  },
  {
    number: 13,
    name: "The Center Moon",
    totem: "Yunsu the Buffalo — Great White Giant of the Cleansing Wind",
    element: "All elements",
    clan: "All clans",
    path: "All paths — the still point of the wheel",
    dates: "The 13th moon — when the calendar turns",
    energy: "Yunsu the Great White Giant stands at the center where all paths cross. This is the still point — Yanu, Yunsu, Awahili, and Tsistu all converge here. The 13th moon does not belong to any season. It is the breath between breaths, the space where one full cycle ends and the mystery of the next has not yet declared itself.",
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
