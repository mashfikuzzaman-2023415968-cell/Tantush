"use client"

import { useI18n } from "@lib/i18n/context"
import { AnimatedMark } from "@modules/common/components/brand/animated-mark"
import { TaglineBn } from "@modules/common/components/brand/logo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { SplitHeading } from "@modules/common/components/motion/split-heading"
import { motion, useScroll, useTransform } from "motion/react"
import Image from "next/image"
import { useRef } from "react"

const EASE = [0.22, 1, 0.36, 1] as const

/** Decorative "threads" that draw themselves across the hero. */
function Threads() {
  const paths = [
    "M-20 520 C 220 380, 420 640, 720 470 S 1180 300, 1500 420",
    "M-20 540 C 230 400, 430 660, 730 490 S 1190 320, 1500 440",
    "M-20 560 C 240 420, 440 680, 740 510 S 1200 340, 1500 460",
  ]
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-tan-400/50"
      viewBox="0 0 1440 800"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
    >
      {paths.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke="currentColor"
          strokeWidth={1.2}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.4, ease: EASE, delay: 0.4 + i * 0.15 }}
        />
      ))}
    </svg>
  )
}

export default function Hero() {
  const { t, lang } = useI18n()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"])
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section
      ref={ref}
      className="relative overflow-hidden grain bg-[radial-gradient(120%_80%_at_20%_10%,#FBF8F4_0%,#EDE6DE_60%,#E2DCCE_100%)]"
    >
      <Threads />
      <div className="content-container relative grid min-h-[calc(100svh-116px)] grid-cols-1 items-center gap-10 py-12 small:grid-cols-12 small:py-0">
        <motion.div style={{ y: textY, opacity: fade }} className="small:col-span-5 relative z-10">
          <div className="flex items-end gap-5 mb-8">
            <AnimatedMark className="h-24 small:h-32 w-auto text-espresso" />
            {lang !== "bn" && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.8, ease: EASE }}
              className="pb-2"
            >
              <TaglineBn className="h-6 w-auto text-cocoa" />
            </motion.div>
            )}
          </div>
          <motion.p
            className="eyebrow mb-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {t.home.heroEyebrow}
          </motion.p>
          <SplitHeading
            text={t.home.heroTitle}
            delay={0.45}
            className={`heading-xl text-balance ${lang === "bn" ? "font-display leading-[1.25]" : ""}`}
          />
          <motion.p
            className="mt-6 max-w-md text-[15px] leading-relaxed text-espresso/75"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.9, ease: EASE }}
          >
            {t.home.heroBody}
          </motion.p>
          <motion.div
            className="mt-9 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.9, ease: EASE }}
          >
            <LocalizedClientLink href="/store" className="btn-primary group">
              {t.home.heroCta}
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </LocalizedClientLink>
            <a href="#showroom" className="btn-outline">
              {t.home.heroCtaSecondary}
            </a>
          </motion.div>
        </motion.div>

        <div className="small:col-span-7 relative h-[62vh] small:h-[78vh]">
          <motion.div
            className="absolute inset-0 overflow-hidden rounded-[28px] small:rounded-[40px] shadow-[0_40px_80px_-40px_rgba(59,42,20,0.55)]"
            initial={{ clipPath: "inset(0% 0% 0% 100% round 40px)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0% round 40px)" }}
            transition={{ duration: 1.5, ease: [0.65, 0, 0.35, 1], delay: 0.2 }}
          >
            <motion.div
              style={{ y: imgY }}
              className="absolute -inset-y-[6%] inset-x-0"
              initial={{ scale: 1.18 }}
              animate={{ scale: 1 }}
              transition={{ duration: 2.4, ease: EASE, delay: 0.2 }}
            >
              <Image
                src="/brand/hero-models.webp"
                alt="Tantush panjabi collection"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover object-[60%_center]"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-espresso/30 via-transparent to-transparent" />
          </motion.div>

          <motion.div
            className="absolute -left-4 bottom-10 small:-left-10 card-surface px-5 py-4 flex items-center gap-3"
            initial={{ opacity: 0, y: 30, rotate: -4 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 1.5, type: "spring", stiffness: 120, damping: 14 }}
          >
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tan-400 opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-cocoa" />
            </span>
            <div>
              <p className="text-sm font-medium text-espresso">{t.home.valuesCod}</p>
              <p className="text-xs text-espresso/60">{t.home.valuesCodBody}</p>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden small:flex flex-col items-center gap-2 text-espresso/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        aria-hidden
      >
        <span className="h-10 w-px bg-espresso/20 overflow-hidden relative">
          <motion.span
            className="absolute inset-x-0 top-0 h-4 bg-espresso/60"
            animate={{ y: [-16, 40] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  )
}
