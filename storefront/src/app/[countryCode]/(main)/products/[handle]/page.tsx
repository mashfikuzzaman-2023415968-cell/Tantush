import { listProducts } from "@lib/data/products"
import { getBaseURL } from "@lib/util/env"
import ProductTemplate from "@modules/products/templates"
import { Metadata } from "next"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { cache } from "react"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
}

const getProduct = cache(async (countryCode: string, handle: string) => {
  if (!/^[a-z0-9-]{1,120}$/.test(handle)) return null
  return listProducts({
    countryCode,
    queryParams: {
      handle,
      fields:
        "*variants.calculated_price,+variants.inventory_quantity,*variants.options,*options,*options.values,*images,*collection,+material,+subtitle",
    } as any,
  }).then(({ response }) => response.products[0] ?? null)
})

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, handle } = await props.params
  const product = await getProduct(countryCode, handle)
  if (!product) notFound()

  const description = product.subtitle || product.description?.slice(0, 160) || product.title
  return {
    title: product.title,
    description,
    alternates: { canonical: `/${countryCode}/products/${handle}` },
    openGraph: {
      title: product.title,
      description,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const { countryCode, handle } = await props.params
  const product = await getProduct(countryCode, handle)
  if (!product) notFound()

  const prices = (product.variants ?? [])
    .map((v: any) => v.calculated_price?.calculated_amount)
    .filter((n): n is number => typeof n === "number")
  const nonce = (await headers()).get("x-nonce") ?? undefined

  // Structured data so Google can show price & availability in results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: (product.images ?? []).map((i) => i.url),
    brand: { "@type": "Brand", name: "Tantush" },
    sku: product.variants?.[0]?.sku ?? undefined,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BDT",
      lowPrice: prices.length ? Math.min(...prices) : undefined,
      highPrice: prices.length ? Math.max(...prices) : undefined,
      availability: (product.variants ?? []).some(
        (v) => !v.manage_inventory || (v.inventory_quantity ?? 0) > 0
      )
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${getBaseURL()}/${countryCode}/products/${handle}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        // JSON.stringify output with "<" escaped cannot break out of the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ProductTemplate product={product} countryCode={countryCode} />
    </>
  )
}
