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
// Reference new moon: Jan 6, 2000 at 18:14 UTC (J2000)
const KNOWN_NEW_MOON = new Date("2000-01-06T18:14:00Z").getTime()
const LUNAR_CYCLE_MS = 29.530588853 * 24 * 60 * 60 * 1000

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
  const elapsed = date.getTime() - KNOWN_NEW_MOON
  const cyclePos = ((elapsed % LUNAR_CYCLE_MS) + LUNAR_CYCLE_MS) % LUNAR_CYCLE_MS
  const fraction = cyclePos / LUNAR_CYCLE_MS // 0 = new, 0.5 = full, 1 = new again

  const dayOfCycle = Math.floor(fraction * 29.53) + 1
  const illumination = Math.round((1 - Math.cos(fraction * 2 * Math.PI)) / 2 * 100)

  let phase: MoonPhase
  let phaseEmoji: string
  if (fraction < 0.0337)       { phase = "New Moon";        phaseEmoji = "🌑" }
  else if (fraction < 0.2500)  { phase = "Waxing Crescent"; phaseEmoji = "🌒" }
  else if (fraction < 0.2837)  { phase = "First Quarter";   phaseEmoji = "🌓" }
  else if (fraction < 0.5000)  { phase = "Waxing Gibbous";  phaseEmoji = "🌔" }
  else if (fraction < 0.5337)  { phase = "Full Moon";       phaseEmoji = "🌕" }
  else if (fraction < 0.7500)  { phase = "Waning Gibbous";  phaseEmoji = "🌖" }
  else if (fraction < 0.7837)  { phase = "Last Quarter";    phaseEmoji = "🌗" }
  else                         { phase = "Waning Crescent";  phaseEmoji = "🌘" }

  const daysToFull = fraction < 0.5
    ? Math.round((0.5 - fraction) * 29.53)
    : null
  const daysToNew = Math.round((1 - fraction) * 29.53)

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
