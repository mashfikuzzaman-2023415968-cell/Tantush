import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { getDictionary } from "@lib/i18n/server"
import { LogoMark, TaglineBn, Wordmark } from "@modules/common/components/brand/logo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SHOP_PHONE = process.env.NEXT_PUBLIC_SHOP_PHONE || "+880 1XXX-XXXXXX"
const SHOP_EMAIL = process.env.NEXT_PUBLIC_SHOP_EMAIL || "hello@tantush.xyz"
const FACEBOOK_URL = process.env.NEXT_PUBLIC_FACEBOOK_URL
const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL

export default async function Footer() {
  const [{ t }, categories, { collections }] = await Promise.all([
    getDictionary(),
    listCategories({ limit: 6, fields: "id,name,handle,parent_category_id" }).catch(() => []),
    listCollections({ limit: "6" }).catch(() => ({ collections: [], count: 0 })),
  ])

  return (
    <footer className="relative bg-espresso text-ivory-200 grain overflow-hidden">
      <LogoMark className="absolute -right-10 -bottom-16 h-[420px] w-auto text-ivory/[0.04] pointer-events-none" />
      <div className="content-container py-16 small:py-20 grid grid-cols-1 small:grid-cols-12 gap-12">
        <div className="small:col-span-4 space-y-5">
          <div className="flex items-center gap-3 text-ivory">
            <LogoMark className="h-14 w-auto" />
            <Wordmark className="h-4 w-auto" />
          </div>
          <TaglineBn className="h-6 w-auto text-tan-300" />
          <p className="text-sm text-ivory-200/70 max-w-xs">{t.footer.tagline}</p>
        </div>

        <div className="small:col-span-2">
          <h3 className="eyebrow !text-tan-300 mb-4">{t.footer.shop}</h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <LocalizedClientLink href="/store" className="link-underline">
                {t.nav.allProducts}
              </LocalizedClientLink>
            </li>
            {collections.map((c) => (
              <li key={c.id}>
                <LocalizedClientLink href={`/collections/${c.handle}`} className="link-underline">
                  {c.title}
                </LocalizedClientLink>
              </li>
            ))}
            {categories.map((c) => (
              <li key={c.id}>
                <LocalizedClientLink href={`/categories/${c.handle}`} className="link-underline">
                  {c.name}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="small:col-span-3">
          <h3 className="eyebrow !text-tan-300 mb-4">{t.footer.help}</h3>
          <ul className="space-y-2.5 text-sm text-ivory-200/80">
            <li>{t.footer.deliveryInfo}: {t.announcement[1]}</li>
            <li>{t.footer.exchange}: {t.home.valuesExchangeBody}</li>
            <li>
              <LocalizedClientLink href="/account/orders" className="link-underline">
                {t.footer.trackOrder}
              </LocalizedClientLink>
            </li>
          </ul>
        </div>

        <div className="small:col-span-3">
          <h3 className="eyebrow !text-tan-300 mb-4">{t.footer.contact}</h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a href={`tel:${SHOP_PHONE.replace(/[^+\d]/g, "")}`} className="link-underline">
                {SHOP_PHONE}
              </a>
            </li>
            <li>
              <a href={`mailto:${SHOP_EMAIL}`} className="link-underline">
                {SHOP_EMAIL}
              </a>
            </li>
            <li className="flex gap-4 pt-2">
              {FACEBOOK_URL && (
                <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="link-underline">
                  Facebook
                </a>
              )}
              {INSTAGRAM_URL && (
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="link-underline">
                  Instagram
                </a>
              )}
            </li>
          </ul>
          <div className="mt-6">
            <p className="eyebrow !text-tan-300 mb-2">{t.footer.payment}</p>
            <span className="inline-flex items-center gap-2 rounded-full border border-ivory/20 px-3 py-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-tan-300" /> {t.checkout.cod}
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="content-container py-6 flex flex-col small:flex-row justify-between gap-2 text-xs text-ivory-200/50">
          <span>© {new Date().getFullYear()} Tantush. {t.footer.rights}</span>
          <span className="font-bangla">সুতোয় গল্প, বুননে ঐতিহ্য</span>
        </div>
      </div>
    </footer>
  )
}
