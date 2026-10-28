"use client"

import type { CatalogSort } from "@lib/data/catalog"
import { useI18n } from "@lib/i18n/context"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

export default function SortSelect({ value }: { value: CatalogSort }) {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const options: { value: CatalogSort; label: string }[] = [
    { value: "created_at", label: t.store.sortNewest },
    { value: "price_asc", label: t.store.sortPriceAsc },
    { value: "price_desc", label: t.store.sortPriceDesc },
    { value: "title", label: t.store.sortName },
  ]

  return (
    <label className="relative inline-flex items-center gap-2 text-[13px] text-espresso/70">
      <span className="hidden xsmall:inline">{t.store.sortBy}</span>
      <select
        value={value}
        data-testid="sort-by"
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set("sort", e.target.value)
          params.delete("page")
          startTransition(() => router.replace(`${pathname}?${params}`, { scroll: false }))
        }}
        className="h-10 appearance-none rounded-full border border-espresso/20 bg-transparent pl-4 pr-9 text-espresso focus:border-espresso outline-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  )
}
