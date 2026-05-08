"use server"

import { signIn } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

export async function loginAction(_prev: unknown, formData: FormData) {
  const email    = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" })
  } catch (e) {
    if (e instanceof AuthError) {
      return "The stars do not recognize these credentials."
    }
    throw e // re-throw redirect — Next.js handles it
  }
}

export async function signupAction(_prev: unknown, formData: FormData) {
  const email    = formData.get("email") as string
  const password = formData.get("password") as string
  const name     = formData.get("name") as string

  if (!email || !password) return "Email and password required."

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return "An account with this email already exists."

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { email, name: name || null, passwordHash } })

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" })
  } catch (e) {
    if (e instanceof AuthError) {
      redirect("/login?created=1")
    }
    throw e
  }
}
