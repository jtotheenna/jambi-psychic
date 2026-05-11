"use client"

import { useEffect, useRef, useState, useCallback } from "react"

// One-time utility: record the Simli welcome video.
// Visit /admin/record → click Record → save the downloaded file as
// /public/galileo-speaking.webm → landing page plays it forever.

export default function RecordWelcomePage() {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const audioRef    = useRef<HTMLAudioElement>(null)
  const clientRef   = useRef<unknown>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef   = useRef<Blob[]>([])

  const [status,       setStatus]       = useState("Connecting to Simli…")
  const [connected,    setConnected]    = useState(false)
  const [recording,    setRecording]    = useState(false)
  const [videoUrl,     setVideoUrl]     = useState<string | null>(null)
  const [idleUrl,      setIdleUrl]      = useState<string | null>(null)
  const [idleRecording, setIdleRecording] = useState(false)
  const sendAudioRef = useRef<((pcm: Uint8Array) => void) | null>(null)

  const initSimli = useCallback(async () => {
    try {
      const { SimliClient, generateIceServers } = await import("simli-client")
      const tokenRes = await fetch("/api/simli/token", { method: "POST" })
      if (!tokenRes.ok) { setStatus("Token fetch failed"); return }
      const { session_token } = await tokenRes.json()
      const iceServers = await generateIceServers(process.env.NEXT_PUBLIC_SIMLI_API_KEY ?? "o9f1298cjhpilxszvk193q")
      const client = new SimliClient(session_token, videoRef.current!, audioRef.current!, iceServers ?? null)

      client.on("start", () => {
        setConnected(true)
        setStatus("Connected ✓  Click 'Record Welcome' to begin")
        sendAudioRef.current = (pcm: Uint8Array) => {
          const CHUNK = 6000
          for (let offset = 0; offset < pcm.length; offset += CHUNK) {
            (client as { sendAudioData: (d: Uint8Array) => void }).sendAudioData(pcm.slice(offset, offset + CHUNK))
          }
        }
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

  async function recordWelcome() {
    if (!connected || !videoRef.current) return

    // Unlock audio
    const sa = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==")
    sa.volume = 0; sa.play().catch(() => {})

    // Get the WebRTC stream from the video element
    const stream = videoRef.current.srcObject as MediaStream
    if (!stream) { setStatus("No video stream yet — wait a moment and try again"); return }

    // Capture video + add audio from the welcome MP3
    const welcomeAudio = new Audio("/galileo-welcome.mp3")

    // Build a combined stream: WebRTC video track + audio from MP3
    const audioCtx   = new AudioContext()
    const destination = audioCtx.createMediaStreamDestination()
    const mp3Source   = audioCtx.createMediaElementSource(welcomeAudio)
    mp3Source.connect(destination)
    mp3Source.connect(audioCtx.destination) // also play through speakers

    const combinedStream = new MediaStream([
      ...stream.getVideoTracks(),
      ...destination.stream.getAudioTracks(),
    ])

    // Start MediaRecorder
    const recorder = new MediaRecorder(combinedStream, { mimeType: "video/webm;codecs=vp9,opus" })
    chunksRef.current = []
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" })
      const url  = URL.createObjectURL(blob)
      setVideoUrl(url)
      setRecording(false)
      setStatus("Done! Preview below. Right-click the video → Save As → save as galileo-speaking.webm in /public/")
    }

    recorderRef.current = recorder
    recorder.start(100)
    setRecording(true)
    setStatus("Recording… speaking welcome…")

    // Fetch + convert welcome audio to PCM for Simli lip sync
    try {
      const res  = await fetch("/galileo-welcome.mp3")
      const blob2 = await res.blob()
      const ab   = await blob2.arrayBuffer()
      const ctx2 = new AudioContext({ sampleRate: 16000 })
      const decoded = await ctx2.decodeAudioData(ab)
      const mono = new Float32Array(decoded.length)
      for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
        const cd = decoded.getChannelData(ch)
        for (let i = 0; i < decoded.length; i++) mono[i] += cd[i] / decoded.numberOfChannels
      }
      const pcm = new Int16Array(decoded.length)
      for (let i = 0; i < decoded.length; i++) {
        const s = Math.max(-1, Math.min(1, mono[i]))
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }
      await ctx2.close()

      // Start both simultaneously
      welcomeAudio.play().catch(() => {})
      sendAudioRef.current?.(new Uint8Array(pcm.buffer))

      const durationMs = (decoded.length / 16000) * 1000 + 800
      await new Promise(r => setTimeout(r, durationMs))
    } catch (e) {
      setStatus("Error during recording: " + String(e))
    }

    recorder.stop()
  }

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
      setIdleRecording(false)
      setStatus("Idle recorded! Preview below. Download and save as /public/galileo-idle.webm")
    }

    recorderRef.current = recorder
    recorder.start(100)
    setIdleRecording(true)
    setStatus("Recording idle… 5 seconds…")
    await new Promise(r => setTimeout(r, 5000))
    recorder.stop()
  }

  return (
    <div style={{ minHeight: "100vh", background: "#04020e", color: "#ddd8f0", padding: "40px 24px", fontFamily: "monospace" }}>
      <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 22, marginBottom: 8 }}>Welcome Video Recorder</h1>
      <p style={{ color: "#7a8ba8", marginBottom: 32, fontSize: 13 }}>
        One-time tool. Records the Simli welcome animation as a WebM file.<br/>
        Save the output to <code style={{ color: "#c9a84c" }}>/public/galileo-speaking.webm</code> and the landing page will play it forever.
      </p>

      <div style={{ marginBottom: 24, padding: "12px 16px", borderRadius: 8, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", fontSize: 13 }}>
        STATUS: {status}
      </div>

      {/* Simli live preview */}
      <div style={{ position: "relative", width: 300, height: 300, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(201,168,76,0.5)", marginBottom: 24, background: "#04020e" }}>
        <video ref={videoRef} autoPlay playsInline style={{ position: "absolute", top: "-10%", left: 0, width: "100%", height: "120%", objectFit: "cover" }} />
        <audio ref={audioRef} autoPlay muted />
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
        <button
          onClick={recordWelcome}
          disabled={!connected || recording || idleRecording}
          style={{ padding: "14px 40px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.5)", background: connected && !recording && !idleRecording ? "rgba(201,168,76,0.15)" : "rgba(42,26,85,0.3)", color: connected && !recording && !idleRecording ? "#c9a84c" : "#4a3870", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", cursor: connected && !recording && !idleRecording ? "pointer" : "not-allowed" }}
        >
          {recording ? "● RECORDING…" : "RECORD WELCOME"}
        </button>

        <button
          onClick={recordIdle}
          disabled={!connected || recording || idleRecording}
          style={{ padding: "14px 40px", borderRadius: 8, border: "1px solid rgba(165,180,252,0.5)", background: connected && !recording && !idleRecording ? "rgba(165,180,252,0.12)" : "rgba(42,26,85,0.3)", color: connected && !recording && !idleRecording ? "#a5b4fc" : "#4a3870", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.2em", cursor: connected && !recording && !idleRecording ? "pointer" : "not-allowed" }}
        >
          {idleRecording ? "● RECORDING IDLE…" : "RECORD IDLE LOOP (5s)"}
        </button>
      </div>

      {videoUrl && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ marginBottom: 12, fontSize: 13, color: "#a5b4fc" }}>
            Welcome preview:
          </div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={videoUrl} controls style={{ width: 300, height: 300, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(201,168,76,0.5)" }} />
          <div style={{ marginTop: 12 }}>
            <a href={videoUrl} download="galileo-speaking.webm" style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(165,180,252,0.4)", background: "rgba(165,180,252,0.1)", color: "#a5b4fc", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", textDecoration: "none" }}>
              DOWNLOAD galileo-speaking.webm
            </a>
          </div>
        </div>
      )}

      {idleUrl && (
        <div>
          <div style={{ marginBottom: 12, fontSize: 13, color: "#a5b4fc" }}>
            Idle loop preview — loops cleanly?
          </div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={idleUrl} autoPlay loop muted controls style={{ width: 300, height: 300, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(165,180,252,0.5)" }} />
          <div style={{ marginTop: 12 }}>
            <a href={idleUrl} download="galileo-idle.webm" style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(165,180,252,0.4)", background: "rgba(165,180,252,0.1)", color: "#a5b4fc", fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: "0.15em", textDecoration: "none" }}>
              DOWNLOAD galileo-idle.webm
            </a>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#4a3870" }}>
            → save to <code style={{ color: "#c9a84c" }}>/public/galileo-idle.webm</code>
          </div>
        </div>
      )}
    </div>
  )
}
