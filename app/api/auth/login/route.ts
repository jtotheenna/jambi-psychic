import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signIn } from "@/lib/auth"

export async function POST(req: Request) {
  const { email, password } = await req.json()

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user?.passwordHash) {
    return Response.json({ error: "No account found with that email." }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return Response.json({ error: "The stars do not recognize these credentials." }, { status: 401 })
  }

  return Response.json({ ok: true, userId: user.id })
}
