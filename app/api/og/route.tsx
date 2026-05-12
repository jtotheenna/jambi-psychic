import { ImageResponse } from "next/og"

export const runtime = "nodejs"

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://askgalileo.live"

  // Fetch Galileo's photo and encode as base64 so ImageResponse can use it
  const imgRes  = await fetch(`${baseUrl}/galileo.jpg`)
  const imgBuf  = await imgRes.arrayBuffer()
  const imgSrc  = `data:image/jpeg;base64,${Buffer.from(imgBuf).toString("base64")}`

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 30%, #1a0d3f 0%, #04020e 70%)",
        fontFamily: "serif",
      }}>
        {/* Glow ring + photo */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 320, height: 320, borderRadius: "50%",
          background: "conic-gradient(from 0deg, rgba(201,168,76,0.7), rgba(124,58,237,0.3), rgba(201,168,76,0.7))",
          padding: 5,
          boxShadow: "0 0 80px rgba(201,168,76,0.35), 0 0 160px rgba(124,58,237,0.2)",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgSrc} width={310} height={310}
            style={{ borderRadius: "50%", objectFit: "cover", objectPosition: "center top" }} />
        </div>

        <div style={{ color: "#f0cc6e", fontSize: 68, letterSpacing: "0.18em", marginTop: 32,
          textShadow: "0 0 40px rgba(201,168,76,0.9)" }}>
          GALILEO
        </div>

        <div style={{ color: "rgba(165,180,252,0.75)", fontSize: 22, letterSpacing: "0.3em", marginTop: 10 }}>
          THE CELESTIAL ORACLE
        </div>

        <div style={{ color: "rgba(200,212,232,0.45)", fontSize: 17, letterSpacing: "0.1em", marginTop: 18 }}>
          Tarot · Palm · Moon · Love · Dream
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
