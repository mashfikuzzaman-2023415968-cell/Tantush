import { getDictionary } from "@lib/i18n/server"
import { LogoLockup } from "@modules/common/components/brand/logo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getDictionary()
  return (
    <div className="relative min-h-screen w-full bg-ivory-50">
      <header className="h-20 border-b border-espresso/10 bg-ivory-50/90 backdrop-blur sticky top-0 z-40">
        <nav className="content-container flex h-full items-center justify-between">
          <LocalizedClientLink
            href="/cart"
            className="flex-1 basis-0 text-sm text-espresso/70 hover:text-espresso"
            data-testid="back-to-cart-link"
          >
            ← {t.checkout.backToBag}
          </LocalizedClientLink>
          <LocalizedClientLink href="/" className="text-espresso" data-testid="store-link" aria-label="Tantush">
            <LogoLockup />
          </LocalizedClientLink>
          <div className="flex-1 basis-0 flex justify-end items-center gap-2 text-xs text-espresso/60">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            <span className="hidden xsmall:inline">SSL</span>
          </div>
        </nav>
      </header>
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
    </div>
  )
}
