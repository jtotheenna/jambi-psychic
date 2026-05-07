let ctx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === "suspended") ctx.resume()
  return ctx
}

// Real bell chime using inharmonic partials (how physical bells actually sound)
function bellChime(ac: AudioContext, freq: number, vol = 0.35, duration = 3.5) {
  const now = ac.currentTime
  // Inharmonic overtone ratios characteristic of struck metal
  const partials = [
    { r: 1,     g: 1.0 },
    { r: 2.756, g: 0.45 },
    { r: 5.404, g: 0.2 },
    { r: 8.933, g: 0.08 },
  ]

  const master = ac.createGain()
  master.gain.setValueAtTime(0, now)
  master.gain.linearRampToValueAtTime(vol, now + 0.004)
  master.gain.exponentialRampToValueAtTime(0.001, now + duration)
  master.connect(ac.destination)

  // Wet reverb tail
  const revWet = ac.createGain()
  revWet.gain.value = 0.22
  revWet.connect(ac.destination)
  const revDelay = ac.createDelay(0.5)
  revDelay.delayTime.value = 0.12
  master.connect(revDelay)
  revDelay.connect(revWet)

  partials.forEach(({ r, g }) => {
    const osc = ac.createOscillator()
    const pg = ac.createGain()
    osc.type = "sine"
    osc.frequency.value = freq * r
    pg.gain.value = g
    osc.connect(pg)
    pg.connect(master)
    osc.start(now)
    osc.stop(now + duration + 0.1)
  })
}

// Wind chime cascade — multiple bells at musical intervals
export function playChime(pitch = 880) {
  const ac = getAudioContext()
  if (!ac) return
  bellChime(ac, pitch, 0.3, 3.2)
}

// Card reveal — ascending chime trio
export function playCardReveal(cardIndex = 0) {
  const ac = getAudioContext()
  if (!ac) return
  const roots = [523.25, 659.25, 783.99, 1046.5]
  const root = roots[cardIndex % roots.length]
  // Major triad arpeggio
  bellChime(ac, root,        0.28, 3.0)
  setTimeout(() => bellChime(ac, root * 1.25,  0.22, 2.8), 120)
  setTimeout(() => bellChime(ac, root * 1.5,   0.18, 2.6), 240)
  setTimeout(() => bellChime(ac, root * 2,     0.14, 2.4), 400)
}

// Box open — dramatic whoosh + rising chime cascade
export function playBoxOpen() {
  const ac = getAudioContext()
  if (!ac) return
  const now = ac.currentTime

  // --- Whoosh layer 1: low rumble sweep ---
  const rumbleSize = Math.floor(ac.sampleRate * 2.5)
  const rumbleBuf = ac.createBuffer(2, rumbleSize, ac.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = rumbleBuf.getChannelData(c)
    for (let i = 0; i < rumbleSize; i++) d[i] = Math.random() * 2 - 1
  }
  const rumble = ac.createBufferSource()
  rumble.buffer = rumbleBuf

  const rumbleFilter = ac.createBiquadFilter()
  rumbleFilter.type = "bandpass"
  rumbleFilter.Q.value = 0.8
  rumbleFilter.frequency.setValueAtTime(60, now)
  rumbleFilter.frequency.exponentialRampToValueAtTime(400, now + 1.0)
  rumbleFilter.frequency.exponentialRampToValueAtTime(80, now + 2.5)

  const rumbleGain = ac.createGain()
  rumbleGain.gain.setValueAtTime(0, now)
  rumbleGain.gain.linearRampToValueAtTime(0.35, now + 0.15)
  rumbleGain.gain.setValueAtTime(0.35, now + 0.8)
  rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5)

  rumble.connect(rumbleFilter)
  rumbleFilter.connect(rumbleGain)
  rumbleGain.connect(ac.destination)
  rumble.start(now)

  // --- Whoosh layer 2: airy high sweep ---
  const airSize = Math.floor(ac.sampleRate * 2.0)
  const airBuf = ac.createBuffer(2, airSize, ac.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = airBuf.getChannelData(c)
    for (let i = 0; i < airSize; i++) d[i] = Math.random() * 2 - 1
  }
  const air = ac.createBufferSource()
  air.buffer = airBuf

  const airFilter = ac.createBiquadFilter()
  airFilter.type = "bandpass"
  airFilter.Q.value = 1.2
  airFilter.frequency.setValueAtTime(300, now + 0.1)
  airFilter.frequency.exponentialRampToValueAtTime(4000, now + 1.0)
  airFilter.frequency.exponentialRampToValueAtTime(1200, now + 2.0)

  const airGain = ac.createGain()
  airGain.gain.setValueAtTime(0, now + 0.1)
  airGain.gain.linearRampToValueAtTime(0.28, now + 0.5)
  airGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0)

  air.connect(airFilter)
  airFilter.connect(airGain)
  airGain.connect(ac.destination)
  air.start(now + 0.1)

  // --- Rising chime cascade after whoosh peaks ---
  const chimeNotes = [261.63, 329.63, 392, 523.25, 659.25, 783.99]
  chimeNotes.forEach((freq, i) => {
    setTimeout(() => bellChime(ac, freq, 0.22 - i * 0.02, 3.0), 600 + i * 160)
  })
}

// Galileo begins speaking — soft ascending shimmer
export function playGalileoSpeak() {
  const ac = getAudioContext()
  if (!ac) return
  // Gentle two-note chime rise
  bellChime(ac, 440, 0.12, 1.5)
  setTimeout(() => bellChime(ac, 554.37, 0.09, 1.2), 180)
}

// Session end — slow descending three-bell toll
export function playSessionEnd() {
  const ac = getAudioContext()
  if (!ac) return
  bellChime(ac, 523.25, 0.3, 4.0)
  setTimeout(() => bellChime(ac, 392,    0.25, 4.0), 600)
  setTimeout(() => bellChime(ac, 261.63, 0.2,  5.0), 1200)
}
