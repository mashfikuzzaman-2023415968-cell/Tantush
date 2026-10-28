"use client"

import { updateLocale } from "@lib/data/locale-actions"
import { LANG_TO_MEDUSA_LOCALE, type Lang } from "@lib/i18n/config"
import { useI18n } from "@lib/i18n/context"
import { clx } from "@medusajs/ui"
import { motion } from "motion/react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

const OPTIONS: { lang: Lang; label: string }[] = [
  { lang: "en", label: "EN" },
  { lang: "bn", label: "বাং" },
]

/** EN / বাংলা pill switch. Switches UI strings and Medusa product translations. */
export default function LanguageToggle({ className }: { className?: string }) {
  const { lang, t } = useI18n()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const change = (next: Lang) => {
    if (next === lang || pending) return
    startTransition(async () => {
      await updateLocale(LANG_TO_MEDUSA_LOCALE[next])
      router.refresh()
    })
  }

  return (
    <div
      role="radiogroup"
      aria-label={t.nav.language}
      className={clx(
        "relative flex items-center rounded-full border border-espresso/15 p-0.5 text-[12px]",
        pending && "opacity-60",
        className
      )}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.lang}
          role="radio"
          aria-checked={lang === o.lang}
          onClick={() => change(o.lang)}
          className={clx(
            "relative z-10 h-7 min-w-[2.4rem] px-2 rounded-full transition-colors duration-300",
            lang === o.lang ? "text-ivory" : "text-espresso/70 hover:text-espresso",
            o.lang === "bn" && "font-bangla"
          )}
        >
          {lang === o.lang && (
            <motion.span
              layoutId="lang-pill"
              className="absolute inset-0 -z-10 rounded-full bg-espresso"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          {o.label}
        </button>
      ))}
    </div>
  )
}
