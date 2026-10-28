import { listCatalog } from "@lib/data/catalog"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { getBaseURL } from "@lib/util/env"
import type { MetadataRoute } from "next"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseURL()
  const cc = process.env.NEXT_PUBLIC_DEFAULT_REGION || "bd"
  const [catalog, categories, { collections }] = await Promise.all([
    listCatalog({ countryCode: cc, limit: 48 }),
    listCategories({ fields: "id,handle,updated_at" }).catch(() => []),
    listCollections({ fields: "id,handle" }).catch(() => ({ collections: [] as { handle: string }[] })),
  ])

  return [
    { url: `${base}/${cc}`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/${cc}/store`, changeFrequency: "daily", priority: 0.9 },
    ...catalog.products.map((p) => ({
      url: `${base}/${cc}/products/${p.handle}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...categories.map((c) => ({ url: `${base}/${cc}/categories/${c.handle}`, priority: 0.7 })),
    ...collections.map((c) => ({ url: `${base}/${cc}/collections/${c.handle}`, priority: 0.7 })),
  ]
}
