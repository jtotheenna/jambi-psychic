import { ImageResponse } from "next/og"

export const runtime = "nodejs"

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#04020e",
          color: "#c9a84c",
          fontSize: 80,
          fontFamily: "serif",
        }}
      >
        GALILEO
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
