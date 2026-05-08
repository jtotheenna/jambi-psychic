"use client"

const MENU_ITEMS = [
  { tokens: "10",  label: "Moon Reading",         desc: "Lunar energy & emotional guidance" },
  { tokens: "20",  label: "One Card Tarot Pull",  desc: "Quick oracle message" },
  { tokens: "20",  label: "Yes / No Oracle",      desc: "Direct symbolic guidance" },
  { tokens: "40",  label: "3 Card Tarot",         desc: "Past · Present · Future" },
  { tokens: "75",  label: "5 Card Full Spread",   desc: "Deep situation reading" },
  { tokens: "100", label: "Oracle Bundle",        desc: "Tarot + Moon Reading" },
  { tokens: "200", label: "Private Deep Session", desc: "Full immersive reading, all spreads" },
]

export default function LiveMenuPage() {
  return (
    <>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:0.6;} 50%{opacity:1;} }
      `}</style>
      <div style={{ minHeight:"100vh", width:"100%",
        background:"radial-gradient(ellipse at 50% 0%,#1a0d3f 0%,#04020e 75%)",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        padding:"32px 40px", position:"relative", overflow:"hidden" }}>

        <div style={{ position:"absolute",inset:0,pointerEvents:"none",
          background:"radial-gradient(ellipse at 50% 30%,rgba(124,58,237,0.07) 0%,transparent 65%)" }} />

        <div style={{ textAlign:"center", marginBottom:28, zIndex:1 }}>
          <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"clamp(20px,3vw,42px)",
            color:"#c9a84c", letterSpacing:"0.1em", textShadow:"0 0 40px rgba(201,168,76,0.45)" }}>Ask Galileo</div>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(11px,1.4vw,17px)",
            color:"#7a8ba8", letterSpacing:"0.4em", textTransform:"uppercase", marginTop:8 }}>Live Oracle Menu</div>
          <div style={{ width:120,height:1, background:"linear-gradient(to right,transparent,#c9a84c,transparent)",
            margin:"18px auto 0", animation:"shimmer 3s ease-in-out infinite" }} />
        </div>

        <div style={{ width:"100%", maxWidth:780, background:"rgba(10,5,32,0.7)",
          border:"1px solid rgba(201,168,76,0.25)", borderRadius:16, overflow:"hidden",
          backdropFilter:"blur(8px)", zIndex:1,
          boxShadow:"0 0 60px rgba(201,168,76,0.08),0 20px 60px rgba(0,0,0,0.5)" }}>
          {MENU_ITEMS.map((item) => (
            <div key={item.tokens+item.label} style={{ display:"flex", alignItems:"center",
              gap:20, padding:"16px 28px", borderBottom:"1px solid rgba(201,168,76,0.08)" }}>
              <div style={{ fontFamily:"'Cinzel Decorative',serif",
                fontSize:"clamp(18px,2.2vw,30px)", color:"#c9a84c",
                textShadow:"0 0 20px rgba(201,168,76,0.3)",
                minWidth:"clamp(80px,10vw,130px)", letterSpacing:"0.05em" }}>{item.tokens}</div>
              <div style={{ width:1, alignSelf:"stretch", background:"rgba(201,168,76,0.2)", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(14px,1.6vw,22px)",
                  color:"#ddd8f0", letterSpacing:"0.05em" }}>{item.label}</div>
                <div style={{ fontFamily:"'EB Garamond',serif", fontSize:"clamp(11px,1.2vw,16px)",
                  color:"#7a6230", fontStyle:"italic", marginTop:2 }}>{item.desc}</div>
              </div>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(9px,1vw,13px)",
                color:"#3a2a6a", letterSpacing:"0.2em", textTransform:"uppercase" }}>tokens</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:24, fontFamily:"'EB Garamond',serif",
          fontSize:"clamp(10px,1vw,13px)", color:"#3a2a6a", textAlign:"center",
          zIndex:1, maxWidth:600, lineHeight:1.5 }}>
          For entertainment and reflection only. No medical, legal, financial, pregnancy, death, or guaranteed love predictions.
        </div>
      </div>
    </>
  )
}
