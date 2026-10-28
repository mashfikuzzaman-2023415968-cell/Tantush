"use client"

import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

export default function ProductDetails({ sections }: { sections: { title: string; body: string }[] }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="divide-y divide-espresso/10 border-y border-espresso/10">
      {sections.map((s, i) => (
        <div key={s.title}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between py-5 text-left text-espresso"
            aria-expanded={open === i}
          >
            <span className="text-[15px]">{s.title}</span>
            <motion.span animate={{ rotate: open === i ? 45 : 0 }} className="text-xl leading-none text-espresso/60">
              +
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <p className="pb-5 text-sm leading-relaxed text-espresso/70 whitespace-pre-line">{s.body}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
