import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { path } = await req.json()
    await prisma.pageView.create({ data: { path: path || "/" } })
  } catch {}
  return Response.json({ ok: true })
}
