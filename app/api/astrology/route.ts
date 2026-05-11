import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { calculateNatalChart, type NatalChart } from "@/lib/astroCalc"
import { languageInstruction, type Language } from "@/lib/language"
import { sseResponse, streamClaude } from "@/lib/streamSSE"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

async function geocode(city: string): Promise<{ lat: number; lon: number; display: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      { headers: { "User-Agent": "GalileoOracle/1.0 (psychic oracle app)" } }
    )
    const data = await res.json()
    if (!data?.length) return null
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      display: data[0].display_name.split(",").slice(0, 2).join(","),
    }
  } catch {
    return null
  }
}

function fmt(pos: { sign: string; degree: number }) {
  return `${Math.floor(pos.degree)}° ${pos.sign}`
}

function buildChartText(chart: NatalChart): string {
  const lines = [
    `☉ Sun:       ${fmt(chart.sun)}`,
    `☽ Moon:      ${fmt(chart.moon)}`,
    `↑ Rising:    ${fmt(chart.rising)}`,
    `☿ Mercury:   ${fmt(chart.mercury)}`,
    `♀ Venus:     ${fmt(chart.venus)}`,
    `♂ Mars:      ${fmt(chart.mars)}`,
    `♃ Jupiter:   ${fmt(chart.jupiter)}`,
    `♄ Saturn:    ${fmt(chart.saturn)}`,
    `♅ Uranus:    ${fmt(chart.uranus)}`,
    `♆ Neptune:   ${fmt(chart.neptune)}`,
    `♇ Pluto:     ${fmt(chart.pluto)}`,
    `☊ N. Node:   ${fmt(chart.northNode)}`,
  ]

  const aspectLines = chart.aspects
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 12)
    .map(a => `  ${a.planet1} ${a.type} ${a.planet2} (${a.orb}° orb)`)

  if (chart.chartPattern) lines.push(`\nChart Pattern: ${chart.chartPattern}`)
  if (aspectLines.length) lines.push(`\nMajor Aspects:\n${aspectLines.join("\n")}`)

  return lines.join("\n")
}

function buildPrompt(
  name: string,
  birthDate: string,
  birthTime: string | null,
  cityDisplay: string,
  chartText: string,
  language: Language
): string {
  const hasTime = !!birthTime
  const langInstr = languageInstruction(language)

  return `You are Galileo — celestial oracle who reads the stars with authority and reverence. ${langInstr}

No asterisks. No markdown headers. No bullet points. Speak in flowing, lyrical prose as if channeling the cosmos directly. This is a sacred document — a person's natal chart, the map of their soul written in the sky at the moment they drew their first breath.

BIRTH INFORMATION:
Name: ${name}
Born: ${birthDate}${birthTime ? ` at ${birthTime}` : " (time unknown — Rising sign estimated as noon birth)"}
Place: ${cityDisplay}

NATAL CHART — these positions are astronomically precise:
${chartText}

Write a comprehensive natal chart reading for ${name}. This is a one-time sacred document — make it thorough, specific, and deeply personal. Structure your reading naturally through these themes, weaving them together as a coherent whole rather than separate sections:

1. ESSENCE — The Sun in ${name.split(" ")[0]}'s chart: their core identity, life force, and what they are here to become.

2. THE INNER WORLD — The Moon: their emotional nature, what they need to feel safe, their relationship with memory and home.

3. THE MASK AND THE GIFT — The Rising sign: how the world receives them before they speak, the energy they project, and how they move through rooms.

4. THE MIND — Mercury: how they process information, communicate, learn, and what kind of thinking brings them alive.

5. LOVE AND BEAUTY — Venus: what they find beautiful, how they love, what they are magnetized toward, their aesthetic soul.

6. THE WILL — Mars: their drive, their anger, their sexuality, what they fight for and how they pursue what they want.

7. EXPANSION AND PHILOSOPHY — Jupiter: where they are blessed, their spiritual philosophy, how luck finds them, where they should take risks.

8. THE TEACHER — Saturn: their greatest life challenge and their most hard-won gift. Where they must earn everything, and why that forging makes them extraordinary.

9. THE GENERATION — Uranus, Neptune, and Pluto speak to their generational story, and how those outer planet energies play through their personal planets based on the aspects.

10. THE ASPECTS — Weave the most significant planetary relationships into the narrative. Name the specific degrees where relevant. Each aspect is a conversation between two forces — what are they saying to each other in ${name.split(" ")[0]}'s chart?

11. THE NORTH NODE — Their soul's evolutionary direction. Where they came from (South Node), what they are growing toward, the invitation this lifetime carries.

12. THE CHINESE ZODIAC — Calculate their Chinese zodiac animal from their birth year and interpret it: the animal's core nature, its shadow, how it interacts with their Western chart. If the two systems agree, say so. If they create tension, explore it.

13. THE THEME — Close with a synthesis: what is the central story of this chart? What is ${name.split(" ")[0]} here to do, experience, and give to the world?

Write at least 1,200 words. Use ${name.split(" ")[0]}'s name throughout. Be specific to their actual placements — never generic. This reading should feel like a letter written from the stars directly to them. Begin immediately without preamble.`
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { name, birthDate, birthTime, birthCity, language = "en" } = await req.json()

  if (!name?.trim() || !birthDate || !birthCity?.trim()) {
    return Response.json({ error: "Name, birth date, and birth city are required" }, { status: 400 })
  }

  // Geocode the birth city
  const geo = await geocode(birthCity)
  const lat = geo?.lat ?? 40.7128   // fallback: New York
  const lon = geo?.lon ?? -74.0060
  const cityDisplay = geo?.display ?? birthCity

  // Parse birth date + time into a JS Date
  let birthDT: Date
  if (birthTime) {
    birthDT = new Date(`${birthDate}T${birthTime}:00`)
  } else {
    // Noon birth if no time provided
    birthDT = new Date(`${birthDate}T12:00:00`)
  }

  // Calculate the natal chart
  const chart = calculateNatalChart(birthDT, lat, lon)
  const chartText = buildChartText(chart)

  // Build Claude prompt
  const prompt = buildPrompt(name, birthDate, birthTime, cityDisplay, chartText, language as Language)

  const userId = session.user.id
  const question = `${name} · born ${birthDate} in ${birthCity}`

  return sseResponse(async (emit) => {
    emit("chart", { chart, chartText })

    const reading = await streamClaude(emit, {
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    })

    await prisma.readingSession.create({
      data: {
        userId,
        type: "astrology",
        status: "complete",
        exchangesTotal: 1,
        exchangesUsed: 1,
        question,
        transcript: JSON.stringify([{ role: "galileo", content: reading }]),
        completedAt: new Date(),
      },
    })

    emit("done", { reading, chart, chartText })
  })
}
