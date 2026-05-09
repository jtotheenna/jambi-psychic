export { auth as middleware } from "@/lib/auth"

export const config = {
  // Match every (app) route by its real URL path — route group name never appears in URLs
  matcher: [
    "/dashboard/:path*",
    "/reading/:path*",
    "/cartomancy/:path*",
    "/moon/:path*",
    "/palm/:path*",
    "/astrology/:path*",
    "/pay/:path*",
  ],
}
