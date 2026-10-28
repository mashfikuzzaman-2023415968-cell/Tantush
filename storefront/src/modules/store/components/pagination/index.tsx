import { fmt, localizeDigits, type Lang } from "@lib/i18n/config"
import type { Dictionary } from "@lib/i18n/dictionaries/en"
import Link from "next/link"

export default function Pagination({
  page,
  totalPages,
  basePath,
  query,
  t,
  lang,
}: {
  page: number
  totalPages: number
  basePath: string
  query: Record<string, string>
  t: Dictionary
  lang: Lang
}) {
  if (totalPages <= 1) return null
  const href = (p: number) => {
    const params = new URLSearchParams(query)
    p > 1 ? params.set("page", String(p)) : params.delete("page")
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  )

  return (
    <nav className="mt-16 flex items-center justify-center gap-2" aria-label={fmt(t.store.page, { page, total: totalPages })}>
      {page > 1 && (
        <Link href={href(page - 1)} className="btn-ghost h-10 px-4 text-sm" rel="prev">
          ← {t.store.previous}
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - pages[i - 1] > 1 && <span className="text-espresso/40">…</span>}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={`grid h-10 w-10 place-items-center rounded-full text-sm transition-colors ${
              p === page ? "bg-espresso text-ivory" : "text-espresso hover:bg-ivory-200"
            }`}
          >
            {localizeDigits(p, lang)}
          </Link>
        </span>
      ))}
      {page < totalPages && (
        <Link href={href(page + 1)} className="btn-ghost h-10 px-4 text-sm" rel="next">
          {t.store.next} →
        </Link>
      )}
    </nav>
  )
}
