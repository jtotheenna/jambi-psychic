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

export default function ChatBubble({ message }: Props) {
  const isGalileo = message.role === "galileo"

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: isGalileo ? "row" : "row-reverse" }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: isGalileo ? "radial-gradient(circle, #1a0d3f, #0a0520)" : "rgba(42,26,85,0.6)",
        border: isGalileo ? "1px solid rgba(165,180,252,0.4)" : "1px solid rgba(201,168,76,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
      }}>
        {isGalileo ? "☽" : "✦"}
      </div>

      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{
          padding: "14px 18px",
          borderRadius: isGalileo ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
          background: isGalileo
            ? "linear-gradient(135deg, rgba(26,13,63,0.9), rgba(10,5,32,0.9))"
            : "rgba(42,26,85,0.5)",
          border: isGalileo ? "1px solid rgba(165,180,252,0.15)" : "1px solid rgba(201,168,76,0.2)",
          fontFamily: "'EB Garamond', serif",
          fontSize: 17, lineHeight: 1.8, color: "#ddd8f0",
          backdropFilter: "blur(8px)",
        }}>
          {message.content}
        </div>

        {isGalileo && message.cards && message.cards.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {message.cards.map((card, i) => (
              <div key={i} style={{
                padding: "3px 10px", borderRadius: 20,
                fontSize: 11, fontFamily: "'Cinzel', serif", letterSpacing: "0.08em",
                color: "#a5b4fc", background: "rgba(79,70,229,0.15)",
                border: "1px solid rgba(79,70,229,0.3)",
              }}>
                {card.position ? `${card.position}: ` : ""}{card.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
