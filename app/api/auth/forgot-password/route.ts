import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import crypto from "crypto"

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email?.trim()) return Response.json({ ok: true }) // silent — don't reveal existence

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) return Response.json({ ok: true }) // silent

  // Delete any existing tokens for this email
  await prisma.passwordResetToken.deleteMany({ where: { email: email.toLowerCase() } })

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

  await prisma.passwordResetToken.create({
    data: { email: email.toLowerCase(), token, expiresAt },
  })

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://askgalileo.live"
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: "Galileo <noreply@askgalileo.live>",
      to: email,
      subject: "Reset your word — Galileo",
      html: `
        <div style="background:#04020e;color:#ddd8f0;padding:40px;font-family:serif;max-width:480px;margin:0 auto">
          <h1 style="font-family:'Georgia',serif;color:#c9a84c;font-size:24px;letter-spacing:0.1em">GALILEO</h1>
          <p style="font-size:17px;line-height:1.7;color:#8878a8;font-style:italic">The stars have received your request.</p>
          <p style="font-size:16px;line-height:1.7">Click below to set a new word. This link expires in one hour.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:rgba(124,58,237,0.2);border:1px solid rgba(124,58,237,0.5);color:#a5b4fc;text-decoration:none;font-family:Georgia,serif;letter-spacing:0.15em;font-size:13px">
            RESET YOUR WORD ✦
          </a>
          <p style="font-size:13px;color:#4a3870">If you didn't request this, ignore this email.</p>
        </div>
      `,
    })
  }

  return Response.json({ ok: true })
}
