"use client"

import { motion } from "motion/react"

/**
 * Reveals a heading line by line, each line sliding up from behind a mask.
 * Lines are split on "\n" so translations control their own line breaks.
 */
export function SplitHeading({
  text,
  className,
  delay = 0,
  as = "h1",
}: {
  text: string
  className?: string
  delay?: number
  as?: "h1" | "h2"
}) {
  const Tag = as
  const lines = text.split("\n")
  return (
    <Tag className={className} aria-label={text.replace(/\n/g, " ")}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]" aria-hidden>
          <motion.span
            className="block"
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.12 }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}
