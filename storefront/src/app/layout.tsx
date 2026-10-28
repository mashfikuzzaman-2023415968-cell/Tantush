import { getDictionary } from "@lib/i18n/server"
import { I18nProvider } from "@lib/i18n/context"
import { getBaseURL } from "@lib/util/env"
import { MotionProvider } from "@modules/common/components/motion/motion-provider"
import { Metadata, Viewport } from "next"
import {
  Cormorant_Garamond,
  Hind_Siliguri,
  Jost,
  Noto_Serif_Bengali,
} from "next/font/google"
import "styles/globals.css"

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
})
const sans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
  display: "swap",
})
const bangla = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-bangla",
  display: "swap",
})
const banglaSerif = Noto_Serif_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600"],
  variable: "--font-bangla-serif",
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary()
  return {
    metadataBase: new URL(getBaseURL()),
    title: { default: t.meta.title, template: "%s · Tantush" },
    description: t.meta.description,
    applicationName: "Tantush",
    icons: { icon: "/brand/tantush-icon.svg", apple: "/brand/apple-touch-icon.png" },
    openGraph: {
      type: "website",
      siteName: "Tantush",
      title: t.meta.title,
      description: t.meta.description,
      images: [{ url: "/brand/og.jpg", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
  }
}

export const viewport: Viewport = {
  themeColor: "#3B2A14",
  width: "device-width",
  initialScale: 1,
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { lang, t } = await getDictionary()

  return (
    <html
      lang={lang}
      data-mode="light"
      className={`${display.variable} ${sans.variable} ${bangla.variable} ${banglaSerif.variable}`}
    >
      <body className={lang === "bn" ? "font-bangla" : "font-sans"}>
        <I18nProvider value={{ lang, t }}>
          <MotionProvider>
            <main className="relative">{props.children}</main>
          </MotionProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
