"use client"

import { motion, type HTMLMotionProps } from "motion/react"

const EASE = [0.22, 1, 0.36, 1] as const

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number
  y?: number
  once?: boolean
}

/** Fades + lifts content into view as it scrolls in. */
export function Reveal({ delay = 0, y = 28, once = true, children, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/** Parent that staggers its <StaggerItem> children. */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  as = "div",
}: {
  children: React.ReactNode
  className?: string
  stagger?: number
  as?: "div" | "ul"
}) {
  const Comp = as === "ul" ? motion.ul : motion.div
  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </Comp>
  )
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode
  className?: string
  as?: "div" | "li"
}) {
  const Comp = as === "li" ? motion.li : motion.div
  return (
    <Comp
      className={className}
      variants={{
        hidden: { opacity: 0, y: 32 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
      }}
    >
      {children}
    </Comp>
  )
}
