"use client"

import { localizeDigits } from "@lib/i18n/config"
import { useI18n } from "@lib/i18n/context"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

// Garment measurements in inches — adjust to your own pattern block.
const ROWS = [
  { size: "38", chest: 40, length: 40, shoulder: 17 },
  { size: "40", chest: 42, length: 41, shoulder: 17.5 },
  { size: "42", chest: 44, length: 42, shoulder: 18 },
  { size: "44", chest: 46, length: 43, shoulder: 18.5 },
  { size: "46", chest: 48, length: 44, shoulder: 19 },
]

export default function SizeGuide() {
  const { t, lang } = useI18n()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs text-cocoa link-underline">
        {t.product.sizeGuide}
      </button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-[110] grid place-items-center p-4" role="dialog" aria-modal="true">
                <motion.div
                  className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  className="relative w-full max-w-lg rounded-3xl bg-ivory-50 p-8 shadow-2xl"
                  initial={{ opacity: 0, y: 30, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                >
                  <div className="flex items-start justify-between mb-6">
                    <h2 className="font-display text-2xl text-espresso">{t.product.sizeGuideTitle}</h2>
                    <button onClick={() => setOpen(false)} aria-label={t.nav.close} className="h-9 w-9 -mr-2 -mt-1 rounded-full hover:bg-ivory-200 grid place-items-center">
                      ✕
                    </button>
                  </div>
                  <table className="w-full text-sm text-center">
                    <thead>
                      <tr className="text-espresso/60 border-b border-espresso/10">
                        {[t.product.sizeCol, t.product.chestCol, t.product.lengthCol, t.product.shoulderCol].map((h) => (
                          <th key={h} className="py-3 font-normal">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ROWS.map((r) => (
                        <tr key={r.size} className="border-b border-espresso/5 text-espresso">
                          {[r.size, r.chest, r.length, r.shoulder].map((v, i) => (
                            <td key={i} className={`py-3 ${i === 0 ? "font-medium" : ""}`}>
                              {localizeDigits(v, lang)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-5 text-xs text-espresso/60">{t.product.sizeGuideNote}</p>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
