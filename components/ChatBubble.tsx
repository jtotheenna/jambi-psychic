"use client"

type Message = {
  role: "user" | "galileo"
  content: string
  cards?: { name: string; position?: string }[]
}

type Props = {
  message: Message
  isLatest?: boolean
}

export default function ChatBubble({ message, isLatest }: Props) {
  const isGalileo = message.role === "galileo"

  return (
    <div
      className={`flex gap-3 animate-fade-up ${isGalileo ? "items-start" : "items-start flex-row-reverse"}`}
    >
      {/* Avatar dot */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          background: isGalileo
            ? "radial-gradient(circle, #1a0d3f, #0a0520)"
            : "rgba(42,26,85,0.6)",
          border: isGalileo ? "1px solid rgba(165,180,252,0.4)" : "1px solid rgba(201,168,76,0.3)",
          boxShadow: isGalileo ? "0 0 8px rgba(165,180,252,0.3)" : "none",
        }}
      >
        {isGalileo ? "☽" : "✦"}
      </div>

      <div style={{ maxWidth: "75%" }}>
        {/* Speaker label */}
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 9,
            letterSpacing: "0.2em",
            color: isGalileo ? "#7a8ba8" : "#7a6230",
            marginBottom: 4,
            textAlign: isGalileo ? "left" : "right",
          }}
        >
          {isGalileo ? "GALILEO" : "YOU"}
        </div>

        {/* Bubble */}
        <div
          style={{
            padding: "14px 18px",
            borderRadius: isGalileo ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
            background: isGalileo
              ? "linear-gradient(135deg, rgba(26,13,63,0.9) 0%, rgba(10,5,32,0.9) 100%)"
              : "rgba(42,26,85,0.5)",
            border: isGalileo
              ? "1px solid rgba(165,180,252,0.2)"
              : "1px solid rgba(201,168,76,0.2)",
            fontFamily: "'EB Garamond', serif",
            fontSize: 17,
            lineHeight: 1.7,
            color: isGalileo ? "#ddd8f0" : "#c8d4e8",
            backdropFilter: "blur(8px)",
          }}
        >
          {message.content}
        </div>

        {/* Card tags if Galileo revealed cards */}
        {isGalileo && message.cards && message.cards.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.cards.map((card, i) => (
              <div
                key={i}
                style={{
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontFamily: "'Cinzel', serif",
                  letterSpacing: "0.08em",
                  color: "#a5b4fc",
                  background: "rgba(79,70,229,0.15)",
                  border: "1px solid rgba(79,70,229,0.3)",
                }}
              >
                {card.position ? `${card.position}: ` : ""}
                {card.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
