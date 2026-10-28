"use client"

import { motion } from "motion/react"
import { MARK } from "./logo-paths"

/**
 * The Tantush mark "woven" into view: the threads rise from the bottom
 * while the ribbon sweeps in, then settles with a soft glow.
 */
export function AnimatedMark({ className, delay = 0.2 }: { className?: string; delay?: number }) {
  return (
    <motion.svg
      viewBox={MARK.viewBox}
      className={className}
      fill="currentColor"
      role="img"
      aria-label="Tantush"
      initial={{ clipPath: "inset(100% 0% 0% 0%)", opacity: 0.2 }}
      animate={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
      transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1], delay }}
    >
      <path fillRule="evenodd" d={MARK.d} />
    </motion.svg>
  )
}
