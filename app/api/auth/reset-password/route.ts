import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const { token, password } = await req.json()
  if (!token || !password || password.length < 6) {
    return Response.json({ error: "Invalid request" }, { status: 400 })
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token } })
  if (!record || record.expiresAt < new Date()) {
    return Response.json({ error: "This link has expired. Request a new one." }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.update({
    where: { email: record.email },
    data: { passwordHash },
  })
  await prisma.passwordResetToken.delete({ where: { token } })

  return Response.json({ ok: true })
}
