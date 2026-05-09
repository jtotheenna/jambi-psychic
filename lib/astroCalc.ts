import * as Astronomy from "astronomy-engine"

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

export interface PlanetPos {
  sign: string
  degree: number       // degree within the sign (0–29.9)
  longitude: number    // absolute ecliptic longitude (0–359.9)
}

export interface Aspect {
  planet1: string
  planet2: string
  type: string
  orb: number
}

export interface NatalChart {
  sun: PlanetPos
  moon: PlanetPos
  rising: PlanetPos
  mercury: PlanetPos
  venus: PlanetPos
  mars: PlanetPos
  jupiter: PlanetPos
  saturn: PlanetPos
  uranus: PlanetPos
  neptune: PlanetPos
  pluto: PlanetPos
  northNode: PlanetPos
  aspects: Aspect[]
  chartPattern: string | null
}

function normLon(lon: number): number {
  return ((lon % 360) + 360) % 360
}

function toPos(lon: number): PlanetPos {
  const l = normLon(lon)
  return {
    sign: SIGNS[Math.floor(l / 30)],
    degree: Math.round((l % 30) * 10) / 10,
    longitude: Math.round(l * 10) / 10,
  }
}

function bodyLon(body: Astronomy.Body, time: Astronomy.AstroTime): number {
  const vec = Astronomy.GeoVector(body, time, true)
  const ecl = Astronomy.Ecliptic(vec)
  return normLon(ecl.elon)
}

function calcAspects(positions: Record<string, number>): Aspect[] {
  const ASPECT_DEFS = [
    { name: "conjunction", angle: 0, orb: 8 },
    { name: "sextile",     angle: 60,  orb: 5 },
    { name: "square",      angle: 90,  orb: 7 },
    { name: "trine",       angle: 120, orb: 7 },
    { name: "opposition",  angle: 180, orb: 8 },
  ]
  const result: Aspect[] = []
  const bodies = Object.keys(positions)
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const diff = Math.abs(positions[bodies[i]] - positions[bodies[j]])
      const angle = diff > 180 ? 360 - diff : diff
      for (const asp of ASPECT_DEFS) {
        const orb = Math.abs(angle - asp.angle)
        if (orb <= asp.orb) {
          result.push({
            planet1: bodies[i],
            planet2: bodies[j],
            type: asp.name,
            orb: Math.round(orb * 10) / 10,
          })
          break
        }
      }
    }
  }
  return result
}

function detectPattern(positions: Record<string, number>): string | null {
  const lons = Object.values(positions)

  // Grand Trine: three planets ~120° apart
  const bodies = Object.keys(positions)
  for (let a = 0; a < bodies.length - 2; a++) {
    for (let b = a + 1; b < bodies.length - 1; b++) {
      for (let c = b + 1; c < bodies.length; c++) {
        const [p1, p2, p3] = [positions[bodies[a]], positions[bodies[b]], positions[bodies[c]]]
        const d12 = Math.min(Math.abs(p1-p2), 360-Math.abs(p1-p2))
        const d23 = Math.min(Math.abs(p2-p3), 360-Math.abs(p2-p3))
        const d13 = Math.min(Math.abs(p1-p3), 360-Math.abs(p1-p3))
        if (Math.abs(d12-120)<8 && Math.abs(d23-120)<8 && Math.abs(d13-120)<8)
          return "Grand Trine"
      }
    }
  }

  // Stellium: 3+ planets within 10° of each other
  for (let i = 0; i < lons.length - 2; i++) {
    let count = 1
    for (let j = i + 1; j < lons.length; j++) {
      const diff = Math.min(Math.abs(lons[i]-lons[j]), 360-Math.abs(lons[i]-lons[j]))
      if (diff <= 10) count++
    }
    if (count >= 3) return "Stellium"
  }

  return null
}

export function calculateNatalChart(date: Date, lat: number, lon: number): NatalChart {
  const time = Astronomy.MakeTime(date)

  // Sun
  const sunPos = Astronomy.SunPosition(time)
  const sunLon = normLon(sunPos.elon)

  // Moon
  const moonEcl = Astronomy.EclipticGeoMoon(time)
  const moonLon = normLon(moonEcl.lon)

  // Planets
  const mercLon = bodyLon(Astronomy.Body.Mercury, time)
  const venLon  = bodyLon(Astronomy.Body.Venus,   time)
  const marsLon = bodyLon(Astronomy.Body.Mars,    time)
  const jupLon  = bodyLon(Astronomy.Body.Jupiter, time)
  const satLon  = bodyLon(Astronomy.Body.Saturn,  time)
  const uraLon  = bodyLon(Astronomy.Body.Uranus,  time)
  const nepLon  = bodyLon(Astronomy.Body.Neptune, time)
  const pluLon  = bodyLon(Astronomy.Body.Pluto,   time)

  // Mean North Node (Meeus formula, accurate to ~1°)
  const T = (time.ut / 36525.0)
  const nodeLon = normLon(125.0445550 - 1934.1361849 * T + 0.0020762 * T * T)

  // Ascendant via sidereal time
  const gmst = Astronomy.SiderealTime(time)               // hours (0–24)
  const ramc = normLon(gmst * 15 + lon)                   // RAMC in degrees
  const E    = (ramc * Math.PI) / 180
  const L    = (lat  * Math.PI) / 180
  const eps  = (23.4367 * Math.PI) / 180                  // obliquity (approximate)
  const ascRad = Math.atan2(-Math.cos(E), Math.sin(E) * Math.cos(eps) + Math.tan(L) * Math.sin(eps))
  const ascLon = normLon((ascRad * 180) / Math.PI)

  const positions: Record<string, number> = {
    Sun: sunLon, Moon: moonLon, Mercury: mercLon, Venus: venLon,
    Mars: marsLon, Jupiter: jupLon, Saturn: satLon,
    Uranus: uraLon, Neptune: nepLon, Pluto: pluLon,
  }

  return {
    sun:      toPos(sunLon),
    moon:     toPos(moonLon),
    rising:   toPos(ascLon),
    mercury:  toPos(mercLon),
    venus:    toPos(venLon),
    mars:     toPos(marsLon),
    jupiter:  toPos(jupLon),
    saturn:   toPos(satLon),
    uranus:   toPos(uraLon),
    neptune:  toPos(nepLon),
    pluto:    toPos(pluLon),
    northNode: toPos(nodeLon),
    aspects: calcAspects(positions),
    chartPattern: detectPattern(positions),
  }
}
