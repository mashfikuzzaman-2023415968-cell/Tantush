import "server-only"
import { getLocale } from "@lib/data/locale-actions"
import { Lang, langFromLocale } from "./config"
import bn from "./dictionaries/bn"
import en, { Dictionary } from "./dictionaries/en"

const dictionaries: Record<Lang, Dictionary> = { en, bn }

export async function getLang(): Promise<Lang> {
  return langFromLocale(await getLocale())
}

export async function getDictionary(): Promise<{ lang: Lang; t: Dictionary }> {
  const lang = await getLang()
  return { lang, t: dictionaries[lang] }
}

export const dictionaryFor = (lang: Lang) => dictionaries[lang]
