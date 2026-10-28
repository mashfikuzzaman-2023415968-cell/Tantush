"use client"

import { createContext, useContext } from "react"
import type { Lang } from "./config"
import type { Dictionary } from "./dictionaries/en"

type I18nValue = { lang: Lang; t: Dictionary }

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({
  value,
  children,
}: {
  value: I18nValue
  children: React.ReactNode
}) {
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error("useI18n must be used inside <I18nProvider>")
  }
  return ctx
}
