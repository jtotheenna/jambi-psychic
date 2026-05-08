"use client"

type Props = {
  total: number
  used: number
}

const GEM_COLORS = [
  "rgba(165,180,252,0.9)",  // crystal
  "rgba(201,168,76,0.9)",   // gold
  "rgba(190,18,60,0.9)",    // ruby
  "rgba(79,70,229,0.9)",    // indigo
  "rgba(200,212,232,0.9)",  // silver
  "rgba(124,58,237,0.9)",   // amethyst
  "rgba(16,185,129,0.9)",   // emerald
  "rgba(240,204,110,0.9)",  // gold bright
  "rgba(165,180,252,0.9)",  // crystal
  "rgba(200,212,232,0.9)",  // silver
]

export default function GemProgress({ total, used }: Props) {
  const remaining = total - used

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2 flex-wrap justify-center">
        {Array.from({ length: total }).map((_, i) => {
          const isUsed = i < used
          const color = GEM_COLORS[i % GEM_COLORS.length]
          return (
            <div
              key={i}
              title={isUsed ? "Exchange used" : "Exchange remaining"}
              style={{
                width: 14,
                height: 18,
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                backgroundColor: isUsed ? "rgba(42,26,85,0.4)" : color,
                opacity: isUsed ? 0.25 : 1,
                boxShadow: isUsed ? "none" : `0 0 8px ${color}, 0 0 16px ${color}40`,
                transition: "all 0.4s ease",
                animation: !isUsed ? "gemPulse 2s ease-in-out infinite" : "none",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          )
        })}
      </div>
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 11,
          letterSpacing: "0.15em",
          color: remaining <= 2 ? "#f0cc6e" : "#7a8ba8",
          transition: "color 0.3s ease",
        }}
      >
        {remaining} {remaining === 1 ? "QUESTION" : "QUESTIONS"} REMAINING
      </div>
    </div>
  )
}
