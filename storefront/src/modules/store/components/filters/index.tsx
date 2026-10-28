"use client"

import { localizeDigits } from "@lib/i18n/config"
import { useI18n } from "@lib/i18n/context"
import { convertToLocale } from "@lib/util/money"
import { clx } from "@medusajs/ui"
import { AnimatePresence, motion } from "motion/react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"

type Props = {
  sizes: string[]
  priceBounds: { min: number; max: number; currency_code: string }
  selectedSizes: string[]
  min?: number
  max?: number
}

function useFilterNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const update = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(patch).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)))
    params.delete("page")
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))
  }
  return { update, pending }
}

function SizeFilter({ sizes, selected, onToggle }: { sizes: string[]; selected: string[]; onToggle: (s: string) => void }) {
  const { lang } = useI18n()
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((s) => (
        <motion.button
          key={s}
          whileTap={{ scale: 0.92 }}
          onClick={() => onToggle(s)}
          className="chip"
          data-active={selected.includes(s)}
          aria-pressed={selected.includes(s)}
        >
          {localizeDigits(s, lang)}
        </motion.button>
      ))}
    </div>
  )
}

function PriceFilter({
  bounds,
  min,
  max,
  onCommit,
}: {
  bounds: Props["priceBounds"]
  min?: number
  max?: number
  onCommit: (min?: number, max?: number) => void
}) {
  const { t } = useI18n()
  const lo = bounds.min
  const hi = Math.max(bounds.max, lo + 1)
  const step = Math.max(10, Math.round((hi - lo) / 50 / 10) * 10)
  const [range, setRange] = useState<[number, number]>([min ?? lo, max ?? hi])
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => setRange([min ?? lo, max ?? hi]), [min, max, lo, hi])

  const commit = (next: [number, number]) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      onCommit(next[0] > lo ? next[0] : undefined, next[1] < hi ? next[1] : undefined)
    }, 450)
  }

  const set = (i: 0 | 1, v: number) => {
    const next: [number, number] = [...range] as [number, number]
    next[i] = v
    if (next[0] > next[1] - step) {
      if (i === 0) next[0] = next[1] - step
      else next[1] = next[0] + step
    }
    setRange(next)
    commit(next)
  }

  const pct = (v: number) => ((v - lo) / (hi - lo)) * 100
  const fmt = (v: number) => convertToLocale({ amount: v, currency_code: bounds.currency_code })

  return (
    <div>
      <div className="relative h-8">
        <div className="absolute top-1/2 h-[3px] w-full -translate-y-1/2 rounded-full bg-ivory-300" />
        <div
          className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-espresso"
          style={{ left: `${pct(range[0])}%`, right: `${100 - pct(range[1])}%` }}
        />
        {[0, 1].map((i) => (
          <input
            key={i}
            type="range"
            min={lo}
            max={hi}
            step={step}
            value={range[i]}
            aria-label={i === 0 ? t.store.min : t.store.max}
            onChange={(e) => set(i as 0 | 1, Number(e.target.value))}
            className="range-thumb pointer-events-none absolute inset-0 w-full appearance-none bg-transparent"
          />
        ))}
      </div>
      <div className="mt-3 flex justify-between text-sm text-espresso">
        <span>{fmt(range[0])}</span>
        <span>{fmt(range[1])}</span>
      </div>
    </div>
  )
}

function FilterBody(props: Props & { onChange: ReturnType<typeof useFilterNavigation>["update"] }) {
  const { t } = useI18n()
  const toggleSize = (s: string) => {
    const next = props.selectedSizes.includes(s)
      ? props.selectedSizes.filter((x) => x !== s)
      : [...props.selectedSizes, s]
    props.onChange({ size: next.length ? next.join(",") : undefined })
  }
  return (
    <div className="space-y-9">
      <section>
        <h3 className="eyebrow mb-4">{t.store.size}</h3>
        <SizeFilter sizes={props.sizes} selected={props.selectedSizes} onToggle={toggleSize} />
      </section>
      {props.priceBounds.max > 0 && (
        <section>
          <h3 className="eyebrow mb-4">{t.store.price}</h3>
          <PriceFilter
            bounds={props.priceBounds}
            min={props.min}
            max={props.max}
            onCommit={(min, max) => props.onChange({ min: min?.toString(), max: max?.toString() })}
          />
        </section>
      )}
    </div>
  )
}

/** Desktop sidebar + mobile bottom sheet for size and price filters. */
export default function Filters({ variant, ...props }: Props & { variant: "sidebar" | "sheet" }) {
  const { t, lang } = useI18n()
  const { update, pending } = useFilterNavigation()
  const [open, setOpen] = useState(false)
  const activeCount = props.selectedSizes.length + (props.min !== undefined || props.max !== undefined ? 1 : 0)

  const clear = () => update({ size: undefined, min: undefined, max: undefined })
  const body = useMemo(() => <FilterBody {...props} onChange={update} />, [props]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      {/* Pending indicator shared with the grid via data attribute on <body> */}
      <PendingFlag pending={pending} />

      {variant === "sidebar" && (
      <aside className="hidden small:block sticky top-32 self-start w-64 shrink-0">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl text-espresso">{t.store.filters}</h2>
          {activeCount > 0 && (
            <button onClick={clear} className="text-xs text-cocoa link-underline">
              {t.store.clearAll}
            </button>
          )}
        </div>
        {body}
      </aside>
      )}

      {variant === "sheet" && (
      <button
        onClick={() => setOpen(true)}
        className="small:hidden btn-outline h-10 px-5 text-[13px]"
      >
        {t.store.filters}
        {activeCount > 0 && (
          <span className="grid h-5 min-w-5 px-1 place-items-center rounded-full bg-espresso text-[10px] text-ivory">
            {localizeDigits(activeCount, lang)}
          </span>
        )}
      </button>
      )}

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] small:hidden" role="dialog" aria-modal="true">
            <motion.div
              className="absolute inset-0 bg-ink/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-ivory-50 px-6 pb-8 pt-3"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 34 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => info.offset.y > 120 && setOpen(false)}
            >
              <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-ivory-400" />
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl text-espresso">{t.store.filters}</h2>
                <button onClick={clear} className="text-sm text-cocoa">
                  {t.store.clearAll}
                </button>
              </div>
              {body}
              <button onClick={() => setOpen(false)} className={clx("btn-primary w-full mt-10", pending && "opacity-70")}>
                {t.store.apply}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

function PendingFlag({ pending }: { pending: boolean }) {
  useEffect(() => {
    document.body.toggleAttribute("data-catalog-pending", pending)
  }, [pending])
  return null
}
