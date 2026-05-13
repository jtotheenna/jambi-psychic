import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/analytics", "/api/"] },
    sitemap: "https://askgalileo.live/sitemap.xml",
  }
}
