import type { Lang } from "@lib/i18n/config"
import type { Dictionary } from "@lib/i18n/dictionaries/en"
import { LogoMark } from "@modules/common/components/brand/logo"
import { ParallaxImage } from "@modules/common/components/motion/parallax-image"
import { Reveal } from "@modules/common/components/motion/reveal"
import CountUp from "../count-up"

export default function Story({ t, lang }: { t: Dictionary; lang: Lang }) {
  return (
    <section className="relative overflow-hidden bg-espresso text-ivory grain py-24 small:py-32">
      <LogoMark className="absolute -left-20 top-10 h-[520px] w-auto text-ivory/[0.035] pointer-events-none" />
      <div className="content-container grid grid-cols-1 small:grid-cols-12 gap-12 items-center">
        <Reveal className="small:col-span-6 order-2 small:order-1">
          <p className="eyebrow !text-tan-300 mb-4">{t.home.storyEyebrow}</p>
          <h2 className="font-display text-[2.2rem] small:text-[3.2rem] leading-[1.1] text-ivory text-balance">
            {t.home.storyTitle}
          </h2>
          <p className="mt-6 text-ivory-200/80 leading-relaxed max-w-xl">{t.home.storyBody}</p>
          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-ivory/15 pt-8">
            {[
              { n: 25, s: "+", label: t.home.storyStat1 },
              { n: 50000, s: "+", label: t.home.storyStat2 },
              { n: 100, s: "%", label: t.home.storyStat3 },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="font-display text-3xl small:text-4xl text-tan-300">
                  <CountUp to={stat.n} suffix={stat.s} lang={lang} />
                </dt>
                <dd className="text-xs text-ivory-200/60 mt-1">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
        <Reveal className="small:col-span-6 order-1 small:order-2" delay={0.15}>
          <ParallaxImage
            src="/brand/banner.webp"
            alt=""
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="aspect-[4/5] small:aspect-[5/6] rounded-[32px]"
            strength={50}
          />
        </Reveal>
      </div>
    </section>
  )
}
