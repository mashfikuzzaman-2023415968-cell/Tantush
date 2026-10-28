"use client"

import { motion } from "motion/react"

/** Animated check mark with radiating "threads". */
export default function SuccessMark() {
  return (
    <div className="relative mx-auto h-28 w-28">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 h-10 w-px origin-bottom bg-tan-400"
          style={{ rotate: i * 30, translateX: "-50%", translateY: "-100%" }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: [0, 1, 0], opacity: [0, 1, 0], y: [-30, -54, -64] }}
          transition={{ duration: 1.1, delay: 0.55, ease: "easeOut" }}
        />
      ))}
      <motion.div
        className="absolute inset-0 rounded-full bg-espresso grid place-items-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 15 }}
      >
        <svg viewBox="0 0 24 24" className="h-12 w-12 text-ivory" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <motion.path
            d="M5 12.5 10 17l9-10"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          />
        </svg>
      </motion.div>
    </div>
  )
}
