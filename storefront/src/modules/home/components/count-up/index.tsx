"use client"

import { animate, useInView } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { localizeDigits, type Lang } from "@lib/i18n/config"

/** Counts up from 0 when scrolled into view. */
export default function CountUp({ to, suffix = "", lang }: { to: number; suffix?: string; lang: Lang }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, to])

  return (
    <span ref={ref}>
      {localizeDigits(value.toLocaleString("en-IN"), lang)}
      {suffix}
    </span>
  )
}
