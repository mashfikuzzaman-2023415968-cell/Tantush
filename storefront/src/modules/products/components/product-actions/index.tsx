"use client"

import { addToCart } from "@lib/data/cart"
import { fmt, localizeDigits } from "@lib/i18n/config"
import { useI18n } from "@lib/i18n/context"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import SizeGuide from "@modules/products/components/size-guide"
import { AnimatePresence, motion } from "motion/react"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

const MAX_QTY = 10
const LOW_STOCK = 3

type Variant = HttpTypes.StoreProductVariant

const optionsOf = (v: Variant) =>
  Object.fromEntries((v.options ?? []).map((o: any) => [o.option_id, o.value])) as Record<string, string>

const stockOf = (v?: Variant) => {
  if (!v) return 0
  if (!v.manage_inventory || v.allow_backorder) return MAX_QTY
  return Math.max(0, v.inventory_quantity ?? 0)
}

function Price({ product, variant }: { product: HttpTypes.StoreProduct; variant?: Variant }) {
  const { t, lang } = useI18n()
  const { cheapestPrice, variantPrice } = getProductPrice({ product, variantId: variant?.id })
  const price = variantPrice || cheapestPrice
  if (!price) return <div className="h-9 w-32 skeleton rounded" />
  const onSale = price.price_type === "sale"
  return (
    <div className="flex items-baseline gap-3">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={price.calculated_price}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={clx("font-display text-3xl", onSale ? "text-cocoa" : "text-espresso")}
          data-testid="product-price"
        >
          {!variant && <span className="text-base text-espresso/50 mr-1.5 font-sans">{t.common.from}</span>}
          {price.calculated_price}
        </motion.span>
      </AnimatePresence>
      {onSale && (
        <>
          <span className="text-espresso/40 line-through" data-testid="original-product-price">
            {price.original_price}
          </span>
          <span className="rounded-full bg-cocoa/10 px-2.5 py-1 text-xs text-cocoa">
            −{localizeDigits(price.percentage_diff, lang)}%
          </span>
        </>
      )}
    </div>
  )
}

export default function ProductActions({ product }: { product: HttpTypes.StoreProduct }) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const countryCode = useParams().countryCode as string
  const variants = product.variants ?? []

  const [options, setOptions] = useState<Record<string, string>>(() => {
    const preset = variants.find((v) => v.id === searchParams.get("v_id"))
    if (preset) return optionsOf(preset)
    return variants.length === 1 ? optionsOf(variants[0]) : {}
  })
  const [qty, setQty] = useState(1)
  const [state, setState] = useState<"idle" | "adding" | "added" | "error">("idle")
  const [shake, setShake] = useState(0)

  const selected = useMemo(
    () =>
      variants.find((v) => {
        const vo = optionsOf(v)
        return (product.options ?? []).every((o) => vo[o.id] && vo[o.id] === options[o.id])
      }),
    [variants, options, product.options]
  )
  const stock = stockOf(selected)
  const maxQty = Math.min(MAX_QTY, stock)

  useEffect(() => {
    setQty((q) => Math.max(1, Math.min(q, maxQty || 1)))
  }, [maxQty])

  // Keep ?v_id in sync so a size can be shared / survives refresh
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if ((params.get("v_id") ?? undefined) === selected?.id) return
    selected ? params.set("v_id", selected.id) : params.delete("v_id")
    router.replace(`${pathname}?${params}`, { scroll: false })
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps

  /** A value is available if some in-stock variant has it (given the other choices). */
  const isValueAvailable = (optionId: string, value: string) =>
    variants.some((v) => {
      const vo = optionsOf(v)
      if (vo[optionId] !== value || stockOf(v) <= 0) return false
      return Object.entries(options).every(([k, val]) => k === optionId || !val || vo[k] === val)
    })

  const add = async () => {
    if (!selected) {
      setShake((s) => s + 1)
      return
    }
    setState("adding")
    try {
      await addToCart({ variantId: selected.id, quantity: qty, countryCode })
      setState("added")
      setTimeout(() => setState("idle"), 2200)
    } catch {
      setState("error")
      setTimeout(() => setState("idle"), 3000)
    }
  }

  const actionsRef = useRef<HTMLDivElement>(null)
  const [actionsVisible, setActionsVisible] = useState(true)
  useEffect(() => {
    const el = actionsRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setActionsVisible(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const soldOut = variants.every((v) => stockOf(v) <= 0)
  const buttonLabel =
    state === "adding"
      ? t.product.adding
      : state === "added"
        ? t.product.added
        : state === "error"
          ? t.common.error
          : soldOut || (selected && stock <= 0)
            ? t.product.outOfStock
            : selected
              ? t.product.addToCart
              : t.product.chooseSize

  const AddButton = ({ className }: { className?: string }) => (
    <motion.button
      onClick={add}
      disabled={state === "adding" || soldOut || (!!selected && stock <= 0)}
      whileTap={{ scale: 0.98 }}
      className={clx("btn-primary w-full h-14 text-[15px]", state === "added" && "!bg-cocoa", className)}
      data-testid="add-product-button"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={buttonLabel}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-2"
        >
          {state === "added" && (
            <motion.svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <motion.path d="M5 12.5 10 17l9-10" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
            </motion.svg>
          )}
          {state === "adding" && (
            <span className="h-4 w-4 rounded-full border-2 border-ivory/30 border-t-ivory animate-spin" />
          )}
          {buttonLabel}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )

  return (
    <>
      <div ref={actionsRef} className="space-y-7">
        <Price product={product} variant={selected} />

        {(product.options ?? []).map((option) => (
          <motion.div
            key={option.id}
            animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : undefined}
            transition={{ duration: 0.45 }}
            data-shake={shake}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="eyebrow">
                {option.title?.toLowerCase() === "size" ? t.product.selectSize : option.title}
              </span>
              {option.title?.toLowerCase() === "size" && <SizeGuide />}
            </div>
            <div className="flex flex-wrap gap-2" data-testid="product-options">
              {[...(option.values ?? [])]
                .sort((a, b) => Number(a.value) - Number(b.value) || a.value.localeCompare(b.value))
                .map((v) => {
                  const available = isValueAvailable(option.id, v.value)
                  const active = options[option.id] === v.value
                  return (
                    <button
                      key={v.id}
                      onClick={() => setOptions((prev) => ({ ...prev, [option.id]: v.value }))}
                      className="chip min-w-[3.4rem]"
                      data-active={active}
                      data-disabled={!available}
                      aria-pressed={active}
                      disabled={!available}
                      data-testid="option-button"
                    >
                      {localizeDigits(v.value, lang)}
                    </button>
                  )
                })}
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {selected && stock > 0 && stock <= LOW_STOCK && selected.manage_inventory && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-cocoa flex items-center gap-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cocoa animate-pulse" />
              {fmt(t.product.onlyLeft, { count: localizeDigits(stock, lang) })}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex gap-3">
          <div className="flex h-14 items-center rounded-full border border-espresso/20" aria-label={t.product.quantity}>
            <button
              className="h-full w-11 text-lg text-espresso disabled:opacity-30"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="−"
            >
              −
            </button>
            <span className="w-6 text-center text-espresso tabular-nums">{localizeDigits(qty, lang)}</span>
            <button
              className="h-full w-11 text-lg text-espresso disabled:opacity-30"
              onClick={() => setQty((q) => Math.min(maxQty || MAX_QTY, q + 1))}
              disabled={!!selected && qty >= maxQty}
              aria-label="+"
            >
              +
            </button>
          </div>
          <AddButton className="flex-1" />
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-ivory-200/70 px-5 py-4 text-sm text-espresso">
          <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-cocoa" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M3 7h18v10H3zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          </svg>
          <div>
            <p className="font-medium">{t.product.codBadge}</p>
            <p className="text-xs text-espresso/60">{t.announcement[1]}</p>
          </div>
        </div>
      </div>

      {/* Sticky mobile bar once the main button scrolls away */}
      <AnimatePresence>
        {!actionsVisible && (
          <motion.div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-espresso/10 bg-ivory-50/95 backdrop-blur px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 small:hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg text-espresso">{product.title}</p>
                <p className="text-xs text-espresso/60">
                  {selected ? `${t.cart.size}: ${localizeDigits(selected.title ?? "", lang)}` : t.product.chooseSize}
                </p>
              </div>
              <AddButton className="!w-auto px-6 h-12" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
