"use client"

import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { AnimatePresence, motion } from "motion/react"
import Image from "next/image"
import { useRef, useState } from "react"

/**
 * Desktop: large image with cursor-follow zoom and thumbnail rail.
 * Mobile: swipeable, snap-scrolling carousel with dots.
 */
export default function ImageGallery({
  images,
  title,
}: {
  images: HttpTypes.StoreProductImage[]
  title: string
}) {
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const current = images[active]

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }

  if (!images.length) {
    return <div className="aspect-[3/4] rounded-2xl bg-ivory-200" />
  }

  return (
    <div>
      {/* Mobile carousel */}
      <div className="small:hidden -mx-5">
        <div
          ref={scroller}
          className="flex snap-x snap-mandatory overflow-x-auto no-scrollbar"
          onScroll={(e) => {
            const el = e.currentTarget
            setActive(Math.round(el.scrollLeft / el.clientWidth))
          }}
        >
          {images.map((img, i) => (
            <div key={img.id} className="relative aspect-[3/4] w-full shrink-0 snap-center">
              <Image
                src={img.url}
                alt={`${title} — ${i + 1}`}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center gap-1.5">
          {images.map((img, i) => (
            <span
              key={img.id}
              className={clx(
                "h-1.5 rounded-full transition-all duration-300",
                i === active ? "w-6 bg-espresso" : "w-1.5 bg-espresso/25"
              )}
            />
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden small:flex gap-4">
        <div className="flex flex-col gap-3 w-20 shrink-0">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              aria-label={`${title} — ${i + 1}`}
              className={clx(
                "relative aspect-[3/4] overflow-hidden rounded-lg transition-all duration-300",
                i === active ? "ring-1 ring-espresso ring-offset-2 ring-offset-ivory-50" : "opacity-60 hover:opacity-100"
              )}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
        <div
          className="relative flex-1 aspect-[3/4] overflow-hidden rounded-2xl bg-ivory-200 cursor-zoom-in"
          onMouseMove={onMove}
          onMouseLeave={() => setZoom(null)}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={current.id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src={current.url}
                alt={title}
                fill
                priority
                sizes="(max-width: 1280px) 55vw, 720px"
                className="object-cover transition-transform duration-300 ease-out"
                style={
                  zoom
                    ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                    : undefined
                }
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
