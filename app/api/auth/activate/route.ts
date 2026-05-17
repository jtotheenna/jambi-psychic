import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const { email, password, firstName } = await req.json()
  if (!email || !password || password.length < 6) {
    return Response.json({ error: "Invalid input." }, { status: 400 })
  }

  let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  // Existing real account — don't overwrite password
  if (user && user.passwordHash !== "GUEST") {
    return Response.json({ existing: true }, { status: 200 })
  }

  const hash = await bcrypt.hash(password, 10)

  if (!user) {
    // No account yet (webhook may not have fired) — create it now
    user = await prisma.user.create({
      data: { email: email.toLowerCase(), name: firstName?.trim() || null, passwordHash: hash },
    })
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, name: firstName?.trim() || user.name || null },
    })
  }

  return Response.json({ ok: true })
}
