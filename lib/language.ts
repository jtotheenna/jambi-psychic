export type Language = "en" | "es" | "fr" | "pt" | "de" | "it"

export const LANGUAGES: { code: Language; label: string; flag: string; name: string }[] = [
  { code: "en", label: "EN", flag: "🇺🇸", name: "English" },
  { code: "es", label: "ES", flag: "🇪🇸", name: "Español" },
  { code: "fr", label: "FR", flag: "🇫🇷", name: "Français" },
  { code: "pt", label: "PT", flag: "🇧🇷", name: "Português" },
  { code: "de", label: "DE", flag: "🇩🇪", name: "Deutsch" },
  { code: "it", label: "IT", flag: "🇮🇹", name: "Italiano" },
]

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English", es: "Spanish", fr: "French", pt: "Portuguese", de: "German", it: "Italian",
}

export function detectLanguage(): Language {
  if (typeof navigator === "undefined") return "en"
  const lang = navigator.language?.toLowerCase() || "en"
  if (lang.startsWith("es")) return "es"
  if (lang.startsWith("fr")) return "fr"
  if (lang.startsWith("pt")) return "pt"
  if (lang.startsWith("de")) return "de"
  if (lang.startsWith("it")) return "it"
  return "en"
}

export function getStoredLanguage(): Language {
  if (typeof localStorage === "undefined") return "en"
  return (localStorage.getItem("galileo-language") as Language) || detectLanguage()
}

export function setStoredLanguage(lang: Language) {
  localStorage.setItem("galileo-language", lang)
}

export function languageInstruction(lang: Language): string {
  if (lang === "en") return ""
  return `\n\nLANGUAGE REQUIREMENT: You MUST respond entirely in ${LANGUAGE_NAMES[lang]}. Every single word of your response must be in ${LANGUAGE_NAMES[lang]}. Do not use English at all. Do not mix languages.`
}
