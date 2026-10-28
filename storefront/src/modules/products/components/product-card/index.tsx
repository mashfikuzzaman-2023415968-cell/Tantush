import type { CatalogProduct } from "@lib/data/catalog"
import type { Dictionary } from "@lib/i18n/dictionaries/en"
import { localizeDigits, type Lang } from "@lib/i18n/config"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

/**
 * Product tile: image cross-fades to the second photo on hover, sizes slide
 * up showing what's in stock, and sale items get a discount badge.
 */
export default function ProductCard({
  product,
  t,
  lang,
  priority = false,
}: {
  product: CatalogProduct
  t: Dictionary
  lang: Lang
  priority?: boolean
}) {
  const priced = product.variants.filter((v) => v.calculated_price)
  const cheapest = priced.sort(
    (a, b) => a.calculated_price!.calculated_amount - b.calculated_price!.calculated_amount
  )[0]?.calculated_price
  const onSale =
    cheapest && cheapest.calculated_price?.price_list_type === "sale" &&
    cheapest.original_amount > cheapest.calculated_amount
  const discount = onSale
    ? Math.round((1 - cheapest!.calculated_amount / cheapest!.original_amount) * 100)
    : 0
  const allSoldOut = product.variants.every((v) => !v.available)
  const [first, second] = [product.thumbnail ?? product.images[0], product.images.find((i) => i !== product.thumbnail)]

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block"
      data-testid="product-wrapper"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-ivory-200">
        {first && (
          <Image
            src={first}
            alt={product.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-all [transition-duration:1200ms] ease-silk group-hover:scale-[1.06]"
          />
        )}
        {second && (
          <Image
            src={second}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover opacity-0 transition-all [transition-duration:1200ms] ease-silk group-hover:opacity-100 group-hover:scale-[1.06]"
          />
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {onSale && (
            <span className="rounded-full bg-cocoa px-2.5 py-1 text-[11px] text-ivory">
              {t.product.sale} −{localizeDigits(discount, lang)}%
            </span>
          )}
          {allSoldOut && (
            <span className="rounded-full bg-ivory/90 px-2.5 py-1 text-[11px] text-espresso">
              {t.product.outOfStock}
            </span>
          )}
        </div>

        <div className="absolute inset-x-3 bottom-3 translate-y-[120%] opacity-0 transition-all duration-500 ease-silk group-hover:translate-y-0 group-hover:opacity-100 hidden small:block">
          <div className="flex flex-wrap justify-center gap-1.5 rounded-lg bg-ivory/90 backdrop-blur px-2 py-2">
            {product.variants
              .filter((v) => v.size)
              .map((v) => (
                <span
                  key={v.id}
                  className={`text-[11px] px-1.5 ${v.available ? "text-espresso" : "text-espresso/30 line-through"}`}
                >
                  {localizeDigits(v.size!, lang)}
                </span>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <h3
          className="font-display text-[1.2rem] leading-snug text-espresso group-hover:text-cocoa transition-colors line-clamp-1"
          data-testid="product-title"
        >
          {product.title}
        </h3>
        {cheapest && (
          <p className="flex items-baseline gap-2 text-sm">
            <span className={onSale ? "text-cocoa font-medium" : "text-espresso/80"} data-testid="price">
              {convertToLocale({ amount: cheapest.calculated_amount, currency_code: cheapest.currency_code })}
            </span>
            {onSale && (
              <span className="text-espresso/40 line-through text-xs" data-testid="original-price">
                {convertToLocale({ amount: cheapest.original_amount, currency_code: cheapest.currency_code })}
              </span>
            )}
          </p>
        )}
      </div>
    </LocalizedClientLink>
  )
}
