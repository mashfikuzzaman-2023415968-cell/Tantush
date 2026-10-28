"use client"

import { useI18n } from "@lib/i18n/context"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { LogoMark } from "@modules/common/components/brand/logo"
import LanguageToggle from "@modules/layout/components/language-toggle"
import { AnimatePresence, motion } from "motion/react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

type NavLink = { href: string; label: string }

/** Full-height mobile menu with staggered links. */
export default function SideMenu({ links }: { links: NavLink[] }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => setMounted(true), [])
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 w-10 -ml-2 grid place-items-center text-espresso small:hidden"
        aria-label={t.nav.menu}
        aria-expanded={open}
        data-testid="nav-menu-button"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" stroke="currentColor" strokeWidth="1.4" fill="none">
          <path d="M4 8h16M4 16h11" strokeLinecap="round" />
        </svg>
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-[100] bg-espresso text-ivory flex flex-col grain"
                initial={{ clipPath: "circle(0% at 32px 40px)" }}
                animate={{ clipPath: "circle(150% at 32px 40px)" }}
                exit={{ clipPath: "circle(0% at 32px 40px)" }}
                transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
                role="dialog"
                aria-modal="true"
              >
                <div className="flex items-center justify-between px-5 h-20">
                  <LogoMark className="h-9 w-auto text-ivory" />
                  <button
                    onClick={() => setOpen(false)}
                    className="h-10 w-10 grid place-items-center rounded-full border border-ivory/20"
                    aria-label={t.nav.close}
                    data-testid="close-menu-button"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <nav className="flex-1 px-6 pt-6">
                  <ul className="space-y-2">
                    {links.map((l, i) => (
                      <motion.li
                        key={l.href}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <LocalizedClientLink
                          href={l.href}
                          className="block font-display text-4xl py-2 hover:text-tan-300 transition-colors"
                        >
                          {l.label}
                        </LocalizedClientLink>
                      </motion.li>
                    ))}
                  </ul>
                </nav>
                <motion.div
                  className="px-6 pb-10 flex items-center justify-between"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <LocalizedClientLink href="/account" className="text-ivory/80 underline underline-offset-4">
                    {t.nav.account}
                  </LocalizedClientLink>
                  <LanguageToggle className="border-ivory/30 [&_button]:text-ivory/80 [&_span]:bg-ivory/20" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
