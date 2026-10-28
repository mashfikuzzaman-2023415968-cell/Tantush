import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { getDictionary } from "@lib/i18n/server"
import { LogoLockup } from "@modules/common/components/brand/logo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import AnnouncementBar from "@modules/layout/components/announcement-bar"
import CartButton from "@modules/layout/components/cart-button"
import HeaderShell from "@modules/layout/components/header-shell"
import LanguageToggle from "@modules/layout/components/language-toggle"
import SideMenu from "@modules/layout/components/side-menu"

const UserIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c1.2-3.6 3.8-5.4 7-5.4s5.8 1.8 7 5.4" strokeLinecap="round" />
  </svg>
)

export default async function Nav() {
  const [{ t }, categories, { collections }] = await Promise.all([
    getDictionary(),
    listCategories({ limit: 10, fields: "id,name,handle,parent_category_id,*parent_category" }).catch(() => []),
    listCollections({ limit: "10" }).catch(() => ({ collections: [], count: 0 })),
  ])

  const links = [
    { href: "/store", label: t.nav.allProducts },
    ...collections.map((c) => ({ href: `/collections/${c.handle}`, label: c.title })),
    ...categories
      .filter((c) => !c.parent_category)
      .map((c) => ({ href: `/categories/${c.handle}`, label: c.name })),
  ]

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      <AnnouncementBar />
      <HeaderShell>
        <nav className="content-container flex items-center justify-between w-full h-full text-[13px] tracking-wide text-espresso">
          <div className="flex-1 basis-0 flex items-center gap-8 h-full">
            <SideMenu links={links} />
            <ul className="hidden small:flex items-center gap-7">
              {links.slice(0, 5).map((l) => (
                <li key={l.href}>
                  <LocalizedClientLink href={l.href} className="link-underline py-1 hover:text-cocoa">
                    {l.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          <LocalizedClientLink href="/" className="text-espresso flex items-center" data-testid="nav-store-link" aria-label="Tantush — home">
            <LogoLockup />
          </LocalizedClientLink>

          <div className="flex items-center gap-x-3 small:gap-x-5 h-full flex-1 basis-0 justify-end">
            <LanguageToggle className="hidden xsmall:flex" />
            <LocalizedClientLink
              className="hidden small:flex h-10 w-10 items-center justify-center hover:text-cocoa"
              href="/account"
              aria-label={t.nav.account}
              data-testid="nav-account-link"
            >
              <UserIcon />
            </LocalizedClientLink>
            <Suspense fallback={<span className="h-10 w-10" />}>
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </HeaderShell>
    </div>
  )
}
