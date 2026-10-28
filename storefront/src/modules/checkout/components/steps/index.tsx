"use client"

import { useI18n } from "@lib/i18n/context"
import { localizeDigits } from "@lib/i18n/config"
import { clx } from "@medusajs/ui"
import { motion } from "motion/react"

export default function Steps({ step }: { step: "details" | "review" }) {
  const { t, lang } = useI18n()
  const items = [
    { key: "details", label: t.checkout.address },
    { key: "review", label: t.checkout.review },
  ]
  const activeIndex = items.findIndex((i) => i.key === step)
  return (
    <ol className="flex items-center gap-3 text-sm">
      {items.map((item, i) => (
        <li key={item.key} className="flex items-center gap-3">
          <span
            className={clx(
              "grid h-8 w-8 place-items-center rounded-full border text-xs transition-colors duration-500",
              i <= activeIndex ? "border-espresso bg-espresso text-ivory" : "border-espresso/25 text-espresso/50"
            )}
          >
            {i < activeIndex ? "✓" : localizeDigits(i + 1, lang)}
          </span>
          <span className={i <= activeIndex ? "text-espresso" : "text-espresso/50"}>{item.label}</span>
          {i < items.length - 1 && (
            <span className="relative h-px w-10 small:w-20 bg-espresso/15 overflow-hidden">
              <motion.span
                className="absolute inset-0 bg-espresso origin-left"
                initial={false}
                animate={{ scaleX: i < activeIndex ? 1 : 0 }}
                transition={{ duration: 0.6 }}
              />
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}
