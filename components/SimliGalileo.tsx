"use client"

import { useEffect, useRef, useState, useCallback } from "react"

type Props = {
  speaking: boolean
  onSendAudio: (fn: (pcm: Uint8Array) => void) => void
  onConnected: () => void
  onDisconnected: () => void
}

// Convert MP3/audio blob → 16kHz mono Int16 PCM for Simli
async function audioBlobToPCM(blob: Blob): Promise<Uint8Array> {
  const arrayBuffer = await blob.arrayBuffer()
  const audioCtx = new AudioContext({ sampleRate: 16000 })
  const decoded = await audioCtx.decodeAudioData(arrayBuffer)

  // Mix down to mono at 16kHz
  const frameCount = decoded.length
  const monoData = new Float32Array(frameCount)
  for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
    const channelData = decoded.getChannelData(ch)
    for (let i = 0; i < frameCount; i++) {
      monoData[i] += channelData[i] / decoded.numberOfChannels
    }
  }

  // Convert float32 → int16
  const pcm = new Int16Array(frameCount)
  for (let i = 0; i < frameCount; i++) {
    const s = Math.max(-1, Math.min(1, monoData[i]))
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  await audioCtx.close()
  return new Uint8Array(pcm.buffer)
}

export default function SimliGalileo({ speaking, onSendAudio, onConnected, onDisconnected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const clientRef = useRef<unknown>(null)
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle")
  const [glowing, setGlowing] = useState(false)

  useEffect(() => { setGlowing(speaking) }, [speaking])

  const init = useCallback(async () => {
    if (status !== "idle") return
    setStatus("connecting")

    try {
      const { SimliClient, generateIceServers } = await import("simli-client")

      const tokenRes = await fetch("/api/simli/token", { method: "POST" })
      if (!tokenRes.ok) throw new Error("Token fetch failed")
      const { session_token } = await tokenRes.json()

      const iceServers = await generateIceServers(process.env.NEXT_PUBLIC_SIMLI_FACE_ID || "")

      const client = new SimliClient(
        session_token,
        videoRef.current!,
        audioRef.current!,
        iceServers ?? null
      )

      client.on("start", () => {
        setStatus("connected")
        onConnected()
        onSendAudio((pcm: Uint8Array) => {
          const CHUNK = 6000
          for (let offset = 0; offset < pcm.length; offset += CHUNK) {
            client.sendAudioData(pcm.slice(offset, offset + CHUNK))
          }
        })
      })

      client.on("stop", () => {
        setStatus("idle")
        onDisconnected()
      })

      client.on("startup_error", (msg: string) => {
        console.error("Simli startup error:", msg)
        setStatus("error")
        onDisconnected()
      })

      await client.start()
      clientRef.current = client
    } catch (err) {
      console.error("Simli init error:", err)
      setStatus("error")
      onDisconnected()
    }
  }, [status, onSendAudio, onConnected, onDisconnected])

  useEffect(() => {
    return () => {
      if (clientRef.current) {
        (clientRef.current as { stop: () => void }).stop?.()
      }
    }
  }, [])

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      {/* Video container — same box shape as GalileoAvatar */}
      <div style={{ width: 220, perspective: "600px" }}>
        <div style={{ height: 50, background: "linear-gradient(180deg, #1e1048 0%, #1a0d3f 100%)", border: `2px solid ${glowing ? "rgba(165,180,252,0.6)" : "rgba(201,168,76,0.4)"}`, borderBottom: "none", borderRadius: "8px 8px 0 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "border-color 0.5s" }}>
          <span style={{ fontSize: 9, color: "rgba(201,168,76,0.6)" }}>✦</span>
          <span style={{ fontSize: 22, color: "#c8d4e8", textShadow: "0 0 8px rgba(200,212,232,0.5)" }}>☽</span>
          <span style={{ fontSize: 9, color: "rgba(201,168,76,0.6)" }}>✦</span>
        </div>
        <div style={{ height: 180, background: "linear-gradient(180deg, #1a0d3f 0%, #0d0621 100%)", border: `2px solid ${glowing ? "rgba(165,180,252,0.6)" : "rgba(201,168,76,0.4)"}`, borderTop: "none", borderRadius: "0 0 12px 12px", position: "relative", overflow: "hidden", transition: "border-color 0.5s", boxShadow: glowing ? "0 0 40px rgba(165,180,252,0.15)" : "none" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(79,70,229,0.35) 0%, rgba(10,5,32,0.95) 70%)" }} />

          {status === "connected" ? (
            <>
              {/* Video cropped to face — zoom in to hide blank areas */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={false}
                style={{
                  position: "absolute",
                  top: "-15%", left: "-15%",
                  width: "130%", height: "130%",
                  objectFit: "cover",
                  filter: "contrast(1.05) saturate(0.9) brightness(0.95)",
                }}
              />
              {/* CRT scanlines */}
              <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 3px)", borderRadius: "0 0 10px 10px" }} />
              {/* Vignette — makes it look like a globe TV */}
              <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 45%, rgba(4,2,14,0.85) 100%)", borderRadius: "0 0 10px 10px" }} />
              {/* Static flicker when speaking */}
              {glowing && <div style={{ position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none", opacity: 0.03, background: "url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyBAMAAADsEZWCAAAAGFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAlT9rKAAAAB3RSTlMACQsODQ8SHBRgAAAAMElEQVQ4y2NgGAWDFjAyMjAoMDAwKDAwMCgwMDgwMDAoMDA4MDAwKDAwODAwGAYAABm4AAGno3IUAAAAASUVORK5CYII=\")", animation: "moonPulse 0.08s steps(1) infinite" }} />}
            </>
          ) : (
            <>
              {/* Static portrait while connecting */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/galileo.jpg" alt="Galileo" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", objectPosition: "center center", background: "#04020e", opacity: 0.7, zIndex: 1 }} />
              {status === "connecting" && (
                <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5, zIndex: 2 }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#a5b4fc", animation: "moonPulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.3}s` }} />)}
                </div>
              )}
              {status === "error" && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/galileo.jpg" alt="Galileo" style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center center", background: "#04020e", opacity: 1 }} />
                </div>
              )}
            </>
          )}

          {/* Corner ornaments */}
          {[{ top: "8px", left: "8px" }, { top: "8px", right: "8px" }, { bottom: "8px", left: "8px" }, { bottom: "8px", right: "8px" }].map((pos, i) => (
            <div key={i} style={{ position: "absolute", ...pos, fontSize: 10, color: "rgba(201,168,76,0.4)", zIndex: 3 }}>◆</div>
          ))}
        </div>
      </div>

      <audio ref={audioRef} autoPlay />

      {/* Connect button — only shown when idle */}
      {status === "idle" && (
        <button onClick={init} style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.15em", color: "#a5b4fc", background: "none", border: "1px solid rgba(165,180,252,0.3)", borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}>
          CONNECT GALILEO ▶
        </button>
      )}

      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 18, letterSpacing: "0.15em" }} className="text-shimmer">GALILEO</div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.2em", color: "#7a8ba8", marginTop: 2 }}>THE CELESTIAL ORACLE</div>
        {status === "connecting" && <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: "0.15em", color: "#4a3870", marginTop: 4 }}>AWAKENING...</div>}
      </div>
    </div>
  )
}

export { audioBlobToPCM }
