"use client"

import { useEffect, useRef, useState, useCallback } from "react"

// Utility: record Galileo's idle loop from the Simli stream.
// Visit /record → wait for face → click Record → download → save as /public/galileo-idle.webm

export default function RecordIdlePage() {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const audioRef    = useRef<HTMLAudioElement>(null)
  const clientRef   = useRef<unknown>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)

  const [status,    setStatus]    = useState("Connecting to Simli…")
  const [connected, setConnected] = useState(false)
  const [recording, setRecording] = useState(false)
  const [idleUrl,   setIdleUrl]   = useState<string | null>(null)

  const initSimli = useCallback(async () => {
    try {
      const { SimliClient, generateIceServers } = await import("simli-client")
      const tokenRes = await fetch("/api/simli/token", { method: "POST" })
      if (!tokenRes.ok) { setStatus("Token fetch failed"); return }
      const { session_token } = await tokenRes.json()
      const iceServers = await generateIceServers("o9f1298cjhpilxszvk193q")
      const client = new SimliClient(session_token, videoRef.current!, audioRef.current!, iceServers ?? null)

      client.on("start", () => {
        setConnected(true)
        setStatus("Connected ✓  Click 'Record Idle Loop' when his face looks natural")
      })

      await client.start()
      clientRef.current = client
    } catch (e) {
      setStatus("Simli connection error: " + String(e))
    }
  }, [])

  useEffect(() => {
    initSimli()
    return () => { (clientRef.current as { stop?: () => void })?.stop?.() }
  }, [initSimli])

  async function recordIdle() {
    if (!connected || !videoRef.current) return
    const stream = videoRef.current.srcObject as MediaStream
    if (!stream) { setStatus("No video stream yet — wait a moment and try again"); return }

    const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" })
    const chunks: Blob[] = []
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" })
      setIdleUrl(URL.createObjectURL(blob))
      setRecording(false)
      setStatus("Done! Preview below — download and save as /public/galileo-idle.webm")
    }

    recorderRef.current = recorder
    recorder.start(100)
    setRecording(true)
    setStatus("Recording… 5 seconds…")
    await new Promise(r => setTimeout(r, 5000))
    recorder.stop()
  }

  return (
    <div style={{ minHeight: "100vh", background: "#04020e", color: "#ddd8f0", padding: "40px 24px", fontFamily: "monospace" }}>
      <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 22, marginBottom: 8 }}>Idle Loop Recorder</h1>
      <p style={{ color: "#7a8ba8", marginBottom: 32, fontSize: 13 }}>
        Records 5 seconds of Galileo&apos;s natural idle animation.<br />
        Download and save to <code style={{ color: "#c9a84c" }}>/public/galileo-idle.webm</code>.
      </p>

      <div style={{ marginBottom: 24, padding: "12px 16px", borderRadius: 8, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", fontSize: 13 }}>
        STATUS: {status}
      </div>

      {/* Live preview */}
      <div style={{ position: "relative", width: 300, height: 300, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(201,168,76,0.5)", marginBottom: 24, background: "#04020e" }}>
        <video ref={videoRef} autoPlay playsInline style={{ position: "absolute", top: "-10%", left: 0, width: "100%", height: "120%", objectFit: "cover" }} />
        <audio ref={audioRef} autoPlay muted />
      </div>

      <button
        onClick={recordIdle}
        disabled={!connected || recording}
        style={{ padding: "14px 40px", borderRadius: 8, border: "1px solid rgba(165,180,252,0.5)", background: connected && !recording ? "rgba(165,180,252,0.12)" : "rgba(42,26,85,0.3)", color: connected && !recording ? "#a5b4fc" : "#4a3870", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", cursor: connected && !recording ? "pointer" : "not-allowed", marginBottom: 32 }}
      >
        {recording ? "● RECORDING…" : "RECORD IDLE LOOP (5s)"}
      </button>

      {idleUrl && (
        <div>
          <div style={{ marginBottom: 12, fontSize: 13, color: "#a5b4fc" }}>Preview — does it loop cleanly?</div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={idleUrl} autoPlay loop muted controls style={{ width: 300, height: 300, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(165,180,252,0.5)" }} />
          <div style={{ marginTop: 12 }}>
            <a href={idleUrl} download="galileo-idle.webm" style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(165,180,252,0.4)", background: "rgba(165,180,252,0.1)", color: "#a5b4fc", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", textDecoration: "none" }}>
              DOWNLOAD galileo-idle.webm
            </a>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#4a3870" }}>
            → save to <code style={{ color: "#c9a84c" }}>/public/galileo-idle-v2.webm</code> then redeploy
          </div>
        </div>
      )}
    </div>
  )
}
