"use client"

import { SUN_BEAR_MOONS, SunBearMoon, MoonData } from "@/lib/moon"

type Props = {
  moonData: MoonData
}

export default function MoonWheel({ moonData }: Props) {
  const { phase, illumination, dayOfCycle, phaseEmoji, sunBearMoon } = moonData
  const total = SUN_BEAR_MOONS.length
  const cx = 160
  const cy = 160
  const r = 128
  const innerR = 68

  const PATHS: Record<string, string> = {
    "Red Path of Life & Growth":              "#be123c",
    "Red Path of Purification":               "#dc4040",
    "Black Path of Enlightenment":            "#a5b4fc",
    "Black Path of Lessons":                  "#7c6adc",
    "All paths — the still point of the wheel": "#c9a84c",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <svg width={420} height={420} viewBox="0 0 320 320" style={{ overflow: "visible" }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="goldglow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={r + 16} fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={r - 16} fill="none" stroke="rgba(42,26,85,0.6)" strokeWidth={1} />

        {/* Path lines from center */}
        {SUN_BEAR_MOONS.map((moon, i) => {
          const angle = (i / total) * 2 * Math.PI - Math.PI / 2
          const x1 = cx + innerR * Math.cos(angle)
          const y1 = cy + innerR * Math.sin(angle)
          const x2 = cx + (r - 18) * Math.cos(angle)
          const y2 = cy + (r - 18) * Math.sin(angle)
          const pathColor = PATHS[moon.path] ?? "rgba(42,26,85,0.4)"
          const isCurrent = moon.number === sunBearMoon.number
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isCurrent ? pathColor : "rgba(42,26,85,0.3)"}
              strokeWidth={isCurrent ? 1.5 : 0.5}
              opacity={isCurrent ? 1 : 0.5}
            />
          )
        })}

        {/* Moon dots + labels */}
        {SUN_BEAR_MOONS.map((moon, i) => {
          const angle = (i / total) * 2 * Math.PI - Math.PI / 2
          const dotX = cx + r * Math.cos(angle)
          const dotY = cy + r * Math.sin(angle)
          const labelX = cx + (r + 24) * Math.cos(angle)
          const labelY = cy + (r + 24) * Math.sin(angle)
          const isCurrent = moon.number === sunBearMoon.number
          const pathColor = PATHS[moon.path] ?? "#7a8ba8"

          // Short moon name (remove "Moon" suffix for space)
          const shortName = moon.name.replace(" Moon", "").replace("Rest and Cleansing", "Rest & Cleanse").replace("Earth Renewal", "Earth Renew")

          return (
            <g key={i}>
              {/* Dot */}
              <circle
                cx={dotX} cy={dotY}
                r={isCurrent ? 7 : 3.5}
                fill={isCurrent ? pathColor : "rgba(42,26,85,0.8)"}
                stroke={isCurrent ? "rgba(201,168,76,0.8)" : "rgba(42,26,85,0.5)"}
                strokeWidth={isCurrent ? 1.5 : 0.5}
                filter={isCurrent ? "url(#goldglow)" : undefined}
              />
              {/* Label */}
              <text
                x={labelX} y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isCurrent ? "#c9a84c" : "rgba(120,100,160,0.7)"}
                fontSize={isCurrent ? 8.5 : 7}
                fontFamily="'Cinzel', serif"
                letterSpacing="0.05em"
                filter={isCurrent ? "url(#glow)" : undefined}
                style={{ fontWeight: isCurrent ? "600" : "400" }}
              >
                {shortName}
              </text>
            </g>
          )
        })}

        {/* Center circle */}
        <circle cx={cx} cy={cy} r={innerR - 4} fill="rgba(10,5,32,0.8)" stroke="rgba(42,26,85,0.6)" strokeWidth={1} />

        {/* Phase emoji */}
        <text x={cx} y={cy - 20} textAnchor="middle" fontSize={28} dominantBaseline="middle">
          {phaseEmoji}
        </text>

        {/* Phase name */}
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#c8d4e8" fontSize={7.5} fontFamily="'Cinzel', serif" letterSpacing="0.08em">
          {phase.toUpperCase()}
        </text>

        {/* Illumination */}
        <text x={cx} y={cy + 24} textAnchor="middle" fill="#7a8ba8" fontSize={7} fontFamily="'Cinzel', serif" letterSpacing="0.06em">
          {illumination}% · DAY {dayOfCycle}
        </text>
      </svg>

      {/* Current moon info */}
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 13, letterSpacing: "0.12em", color: "#c9a84c", marginBottom: 4 }}>
          {sunBearMoon.name}
        </div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em", color: "#7a8ba8", marginBottom: 6 }}>
          {sunBearMoon.totem.toUpperCase()} · {sunBearMoon.clan.toUpperCase()}
        </div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.12em", color: PATHS[sunBearMoon.path] ?? "#4a3870" }}>
          {sunBearMoon.path.toUpperCase()}
        </div>
      </div>
    </div>
  )
}
