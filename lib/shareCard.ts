export async function generateShareCard(opts: {
  readingType: string
  spread: string | null
  cards: string[]
  quote: string
}): Promise<string> {
  const W = 1080
  const H = 1920
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!

  await document.fonts.ready

  // ── Background ──────────────────────────────────────────────────────────────
  const bg = ctx.createRadialGradient(W / 2, H * 0.35, 0, W / 2, H * 0.35, H * 0.75)
  bg.addColorStop(0, "#1a0d3f")
  bg.addColorStop(0.5, "#0a0520")
  bg.addColorStop(1, "#04020e")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Secondary glow — indigo upper
  const glow1 = ctx.createRadialGradient(W * 0.2, H * 0.15, 0, W * 0.2, H * 0.15, 500)
  glow1.addColorStop(0, "rgba(79,70,229,0.18)")
  glow1.addColorStop(1, "rgba(79,70,229,0)")
  ctx.fillStyle = glow1
  ctx.fillRect(0, 0, W, H)

  // Gold glow — lower right
  const glow2 = ctx.createRadialGradient(W * 0.8, H * 0.65, 0, W * 0.8, H * 0.65, 400)
  glow2.addColorStop(0, "rgba(201,168,76,0.12)")
  glow2.addColorStop(1, "rgba(201,168,76,0)")
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, W, H)

  // ── Stars ───────────────────────────────────────────────────────────────────
  const rng = mulberry32(42)
  for (let i = 0; i < 180; i++) {
    const x = rng() * W
    const y = rng() * H
    const r = rng() * 1.6 + 0.3
    const a = rng() * 0.7 + 0.1
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(200,212,232,${a})`
    ctx.fill()
  }

  // ── Top ornament ─────────────────────────────────────────────────────────────
  ctx.strokeStyle = "rgba(201,168,76,0.25)"
  ctx.lineWidth = 1
  hline(ctx, W * 0.12, W * 0.88, 148)

  ctx.fillStyle = "#c9a84c"
  ctx.font = "500 38px 'Cinzel', serif"
  ctx.textAlign = "center"
  ctx.fillText("✦", W / 2, 144)

  // ── GALILEO wordmark ────────────────────────────────────────────────────────
  ctx.fillStyle = "#f0cc6e"
  ctx.font = "700 96px 'Cinzel Decorative', serif"
  ctx.textAlign = "center"
  ctx.letterSpacing = "0.15em"
  ctx.fillText("GALILEO", W / 2, 260)

  ctx.fillStyle = "#6a5a8a"
  ctx.font = "400 28px 'Cinzel', serif"
  ctx.letterSpacing = "0.45em"
  ctx.fillText("THE CELESTIAL ORACLE", W / 2, 320)

  // ── Reading type label ───────────────────────────────────────────────────────
  hline(ctx, W * 0.3, W * 0.7, 370)
  ctx.fillStyle = "#9a8ab8"
  ctx.font = "400 26px 'Cinzel', serif"
  ctx.letterSpacing = "0.3em"
  ctx.fillText(opts.readingType.toUpperCase(), W / 2, 420)
  if (opts.spread) {
    ctx.fillStyle = "#6a5a8a"
    ctx.font = "italic 24px 'EB Garamond', serif"
    ctx.letterSpacing = "0"
    ctx.fillText(opts.spread, W / 2, 458)
  }

  // ── Cards ────────────────────────────────────────────────────────────────────
  if (opts.cards.length > 0) {
    const cards = opts.cards.slice(0, 7)
    const cardW = 110
    const cardH = 180
    const gap = 18
    const totalW = cards.length * cardW + (cards.length - 1) * gap
    const startX = (W - totalW) / 2
    const cardY = 510

    cards.forEach((name, i) => {
      const x = startX + i * (cardW + gap)
      // Card bg
      const cg = ctx.createLinearGradient(x, cardY, x, cardY + cardH)
      cg.addColorStop(0, "rgba(26,13,63,0.95)")
      cg.addColorStop(1, "rgba(10,5,32,0.95)")
      roundRect(ctx, x, cardY, cardW, cardH, 8)
      ctx.fillStyle = cg
      ctx.fill()
      ctx.strokeStyle = "rgba(201,168,76,0.35)"
      ctx.lineWidth = 1
      ctx.stroke()

      // Card star symbol
      ctx.fillStyle = "rgba(201,168,76,0.6)"
      ctx.font = "22px 'Cinzel', serif"
      ctx.textAlign = "center"
      ctx.fillText("✦", x + cardW / 2, cardY + 36)

      // Card name — split on " of "
      ctx.fillStyle = "#ddd8f0"
      ctx.font = `500 ${cards.length > 5 ? 11 : 13}px 'Cinzel', serif`
      ctx.letterSpacing = "0"
      const parts = splitCardName(name)
      parts.forEach((line, li) => {
        ctx.fillText(line, x + cardW / 2, cardY + 70 + li * 20)
      })
    })
  }

  // ── Quote ────────────────────────────────────────────────────────────────────
  const quoteTop = opts.cards.length > 0 ? 760 : 540
  hline(ctx, W * 0.12, W * 0.88, quoteTop)

  ctx.fillStyle = "rgba(201,168,76,0.15)"
  ctx.font = "220px 'EB Garamond', serif"
  ctx.textAlign = "left"
  ctx.fillText('"', 80, quoteTop + 180)

  const quote = trimQuote(opts.quote, 220)
  ctx.fillStyle = "#ddd8f0"
  ctx.font = "italic 52px 'EB Garamond', serif"
  ctx.textAlign = "center"
  ctx.letterSpacing = "0"
  wrapText(ctx, quote, W / 2, quoteTop + 100, W - 160, 72)

  // ── Bottom ───────────────────────────────────────────────────────────────────
  hline(ctx, W * 0.12, W * 0.88, H - 180)

  ctx.fillStyle = "#c9a84c"
  ctx.font = "400 30px 'Cinzel', serif"
  ctx.letterSpacing = "0.25em"
  ctx.textAlign = "center"
  ctx.fillText("askgalileo.live", W / 2, H - 120)

  ctx.fillStyle = "rgba(201,168,76,0.4)"
  ctx.font = "26px 'Cinzel', serif"
  ctx.fillText("✦", W / 2, H - 72)

  return canvas.toDataURL("image/png")
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function hline(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number) {
  const g = ctx.createLinearGradient(x1, y, x2, y)
  g.addColorStop(0, "transparent")
  g.addColorStop(0.5, "rgba(201,168,76,0.35)")
  g.addColorStop(1, "transparent")
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2, y)
  ctx.strokeStyle = g
  ctx.lineWidth = 1
  ctx.stroke()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function splitCardName(name: string): string[] {
  if (name.includes(" of ")) {
    const [rank, suit] = name.split(" of ")
    return [rank, "of " + suit]
  }
  if (name.length > 12) {
    const mid = name.lastIndexOf(" ", 12)
    return [name.slice(0, mid), name.slice(mid + 1)]
  }
  return [name]
}

function trimQuote(text: string, maxChars: number): string {
  // Extract first sentence that's meaningful
  const sentences = text.replace(/\[.*?\]/g, "").split(/(?<=[.!?])\s+/)
  let result = ""
  for (const s of sentences) {
    if ((result + s).length > maxChars) break
    result += (result ? " " : "") + s
  }
  return result || text.slice(0, maxChars)
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(" ")
  let line = ""
  let cy = y
  for (const word of words) {
    const test = line ? line + " " + word : word
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy)
      line = word
      cy += lineH
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, cy)
}
