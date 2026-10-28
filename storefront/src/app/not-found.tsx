import { getDictionary } from "@lib/i18n/server"
import { LogoMark } from "@modules/common/components/brand/logo"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "404",
  robots: { index: false },
}

export default async function NotFound() {
  const { t } = await getDictionary()
  return (
    <div className="grain flex min-h-screen flex-col items-center justify-center gap-6 bg-ivory-200 px-6 text-center">
      <LogoMark className="h-24 w-auto text-espresso" />
      <h1 className="heading-lg">{t.common.notFound}</h1>
      <p className="text-espresso/70">{t.common.notFoundBody}</p>
      <Link href="/" className="btn-primary">
        {t.common.goHome}
      </Link>
    </div>
  )
}
