import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const { email, password, firstName } = await req.json()
  if (!email || !password || password.length < 6) {
    return Response.json({ error: "Invalid input." }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) return Response.json({ error: "No account found for this email." }, { status: 404 })

  // Existing account — don't overwrite their real password
  if (user.passwordHash !== "GUEST") {
    return Response.json({ existing: true }, { status: 200 })
  }

  const hash = await bcrypt.hash(password, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash, name: firstName?.trim() || user.name || null },
  })

  return Response.json({ ok: true })
}
