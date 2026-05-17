import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Galileo — AI Tarot, Palm & Moon Readings",
  description: "An ancient oracle who reads tarot, your palm, and the live moon — then speaks his answer aloud in his own voice. He remembers you across every visit. Readings start at $3.",
  keywords: ["tarot reading", "palm reading", "moon reading", "ai tarot", "online tarot", "psychic reading", "astrology", "oracle", "tarot cards"],
  openGraph: {
    title: "Galileo — AI Tarot, Palm & Moon Readings",
    description: "An ancient oracle in a moon box. Tarot, palm reading, and live moon readings — spoken aloud in his own voice.",
    type: "website",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Galileo the Celestial Oracle" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Galileo — AI Tarot, Palm & Moon Readings",
    description: "An ancient oracle in a moon box. Real tarot. Real palm readings. The live moon. Spoken aloud.",
    images: ["/api/og"],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" style={{ background: "#04020e" }}>
      <head>
        <style>{`body { background: #04020e; }`}</style>
        <meta name="google-site-verification" content="VwxAfnWtF6soMvoNTS4lb4zLA-3t6MgAl4k3jCRskE0" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap"
          rel="stylesheet"
        />
        {/* TikTok Pixel */}
        <script dangerouslySetInnerHTML={{ __html: `
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
            ttq.load('D84JHC3C77U9GTJU1T60');
            ttq.page();
          }(window, document, 'ttq');
        `}} />

        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
          <script dangerouslySetInnerHTML={{ __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}} />
        </>}
      </head>
      <body className="min-h-full relative z-10">{children}</body>
    </html>
  )
}
