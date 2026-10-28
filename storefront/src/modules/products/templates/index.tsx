import { getDictionary } from "@lib/i18n/server"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Reveal } from "@modules/common/components/motion/reveal"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductDetails from "@modules/products/components/product-details"
import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { Suspense } from "react"

export default async function ProductTemplate({
  product,
  countryCode,
}: {
  product: HttpTypes.StoreProduct
  countryCode: string
}) {
  if (!product?.id) notFound()
  const { t } = await getDictionary()

  const sections = [
    product.description && { title: t.product.details, body: product.description },
    product.material && { title: t.product.fabric, body: product.material },
    { title: t.product.deliveryReturns, body: t.product.deliveryText },
    { title: t.product.care, body: t.product.careText },
  ].filter(Boolean) as { title: string; body: string }[]

  return (
    <>
      <div className="content-container pt-6 small:pt-10" data-testid="product-container">
        <nav className="mb-6 text-xs text-espresso/50 flex gap-2" aria-label="Breadcrumb">
          <LocalizedClientLink href="/" className="hover:text-espresso">
            {t.nav.home}
          </LocalizedClientLink>
          <span>/</span>
          <LocalizedClientLink href="/store" className="hover:text-espresso">
            {t.nav.shop}
          </LocalizedClientLink>
          {product.collection && (
            <>
              <span>/</span>
              <LocalizedClientLink href={`/collections/${product.collection.handle}`} className="hover:text-espresso">
                {product.collection.title}
              </LocalizedClientLink>
            </>
          )}
        </nav>

        <div className="grid grid-cols-1 small:grid-cols-12 gap-8 small:gap-14">
          <div className="small:col-span-7">
            <ImageGallery images={product.images ?? []} title={product.title} />
          </div>
          <div className="small:col-span-5">
            <div className="small:sticky small:top-32 space-y-8">
              <Reveal y={16}>
                {product.collection && <p className="eyebrow mb-3">{product.collection.title}</p>}
                <h1 className="font-display text-[2.2rem] small:text-[2.8rem] leading-[1.08] text-espresso" data-testid="product-title">
                  {product.title}
                </h1>
                {product.subtitle && <p className="mt-3 text-espresso/60">{product.subtitle}</p>}
              </Reveal>
              <Reveal y={16} delay={0.1}>
                <ProductActions product={product} />
              </Reveal>
              <Reveal y={16} delay={0.2}>
                <ProductDetails sections={sections} />
              </Reveal>
            </div>
          </div>
        </div>
      </div>

      <div className="content-container my-20 small:my-32" data-testid="related-products-container">
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}
