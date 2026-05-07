import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Ask Galileo — The Celestial Oracle",
  description: "An ancient fortune teller awaits inside the box. He has seen your situation before. He cares about you anyway.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full relative z-10">{children}</body>
    </html>
  )
}
