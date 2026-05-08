"use client"

import { useEffect, useRef, useState, useCallback } from "react"

type Props = {
  speaking: boolean
  onSendAudio: (fn: (pcm: Uint8Array) => void) => void
}

async function audioBlobToPCM(blob: Blob): Promise<Uint8Array> {
  const arrayBuffer = await blob.arrayBuffer()
  const audioCtx = new AudioContext({ sampleRate: 16000 })
  const decoded = await audioCtx.decodeAudioData(arrayBuffer)
  const monoData = new Float32Array(decoded.length)
  for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
    const channelData = decoded.getChannelData(ch)
    for (let i = 0; i < decoded.length; i++) monoData[i] += channelData[i] / decoded.numberOfChannels
  }
  const pcm = new Int16Array(decoded.length)
  for (let i = 0; i < decoded.length; i++) {
    const s = Math.max(-1, Math.min(1, monoData[i]))
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  await audioCtx.close()
  return new Uint8Array(pcm.buffer)
}

export { audioBlobToPCM }

export default function FloatingSimli({ speaking, onSendAudio }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const clientRef = useRef<unknown>(null)
  const [connected, setConnected] = useState(false)

  const init = useCallback(async () => {
    try {
      const { SimliClient, generateIceServers } = await import("simli-client")
      const tokenRes = await fetch("/api/simli/token", { method: "POST" })
      if (!tokenRes.ok) return
      const { session_token } = await tokenRes.json()
      const iceServers = await generateIceServers("o9f1298cjhpilxszvk193q")
      const client = new SimliClient(session_token, videoRef.current!, audioRef.current!, iceServers ?? null)

      client.on("start", () => {
        setConnected(true)
        onSendAudio((pcm: Uint8Array) => {
          const CHUNK = 6000
          for (let offset = 0; offset < pcm.length; offset += CHUNK) {
            client.sendAudioData(pcm.slice(offset, offset + CHUNK))
          }
        })
      })

      await client.start()
      clientRef.current = client
    } catch (err) {
      console.error("FloatingSimli error:", err)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    init()
    return () => { (clientRef.current as { stop?: () => void })?.stop?.() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{
      width: 100, height: 100, borderRadius: "50%", overflow: "hidden",
      border: `2px solid ${speaking ? "rgba(165,180,252,0.8)" : "rgba(201,168,76,0.4)"}`,
      boxShadow: speaking ? "0 0 30px rgba(165,180,252,0.4)" : "0 0 16px rgba(201,168,76,0.15)",
      transition: "border-color 0.3s, box-shadow 0.3s",
      background: "#04020e",
      position: "relative",
    }}>
      {/* Static portrait until connected */}
      {!connected && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/galileo.jpg" alt="Galileo" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          position: "absolute", top: "-10%", left: 0, width: "100%", height: "120%",
          objectFit: "cover",
          objectPosition: "center top",
          opacity: connected ? 1 : 0,
          transition: "opacity 0.5s",
          filter: "contrast(1.05) saturate(0.9)",
        }}
      />
      {/* Scanlines */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 3px)", pointerEvents: "none" }} />
      {/* Vignette */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(4,2,14,0.6) 100%)", pointerEvents: "none" }} />
      <audio ref={audioRef} autoPlay muted />
    </div>
  )
}
