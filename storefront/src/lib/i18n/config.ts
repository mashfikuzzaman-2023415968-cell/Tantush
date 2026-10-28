export const LANGS = ["en", "bn"] as const
export type Lang = (typeof LANGS)[number]

/** Medusa locale codes used for translated product content. */
export const LANG_TO_MEDUSA_LOCALE: Record<Lang, string> = {
  en: "en-US",
  bn: "bn-BD",
}

export const DEFAULT_LANG: Lang = "en"

export const langFromLocale = (locale?: string | null): Lang =>
  locale?.toLowerCase().startsWith("bn") ? "bn" : DEFAULT_LANG

/** Replaces {name} placeholders. */
export const fmt = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""))

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"]
export const toBnDigits = (value: string | number) =>
  String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)])

export const localizeDigits = (value: string | number, lang: Lang) =>
  lang === "bn" ? toBnDigits(value) : String(value)
