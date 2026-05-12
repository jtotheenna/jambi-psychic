export async function POST() {
  const apiKey = process.env.SIMLI_API_KEY!
  const faceId = process.env.SIMLI_FACE_ID!

  const res = await fetch("https://api.simli.ai/startAudioToVideoSession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey,
      faceId,
      handleSilence: true,
      maxSessionLength: 300,
      maxIdleTime: 60,
    }),
  })

  if (!res.ok) {
    return Response.json({ error: "Failed to create Simli session" }, { status: 500 })
  }

  const data = await res.json()
  return Response.json({ session_token: data.session_token })
}
