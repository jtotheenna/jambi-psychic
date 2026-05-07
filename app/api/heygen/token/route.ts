import { auth } from "@/lib/auth"

export async function POST() {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const res = await fetch("https://api.liveavatar.com/v1/sessions/token", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.LIVEAVATAR_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      avatar_id: process.env.HEYGEN_AVATAR_ID,
    }),
  })

  const json = await res.json()
  if (!res.ok || json.code !== 100) {
    console.error("LiveAvatar token error:", JSON.stringify(json))
    return Response.json({ error: json.message || "Failed to get token" }, { status: 500 })
  }

  return Response.json({ token: json.data.session_token })
}
