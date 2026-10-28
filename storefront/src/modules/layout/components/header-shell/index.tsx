"use client"

import { clx } from "@medusajs/ui"
import { useEffect, useState } from "react"

/** Sticky header that condenses and gains a frosted backdrop once you scroll. */
export default function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={clx(
        "relative mx-auto border-b transition-all duration-500 ease-silk",
        scrolled
          ? "h-16 bg-ivory-50/85 backdrop-blur-md border-espresso/10 shadow-[0_8px_30px_-20px_rgba(59,42,20,0.5)]"
          : "h-20 bg-ivory-50 border-transparent"
      )}
    >
      {children}
    </header>
  )
}
