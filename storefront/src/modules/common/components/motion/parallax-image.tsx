"use client"

import { motion, useScroll, useTransform } from "motion/react"
import Image, { type ImageProps } from "next/image"
import { useRef } from "react"

/** Image that drifts slightly slower than the page for depth. */
export function ParallaxImage({
  strength = 60,
  className,
  ...img
}: ImageProps & { strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength])

  return (
    <div ref={ref} className={`relative overflow-hidden ${className ?? ""}`}>
      <motion.div style={{ y }} className="absolute -inset-y-[80px] inset-x-0">
        <Image {...img} alt={img.alt} fill className="object-cover" />
      </motion.div>
    </div>
  )
}
