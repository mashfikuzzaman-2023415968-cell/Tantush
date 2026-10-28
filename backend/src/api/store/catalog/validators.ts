import { z } from "@medusajs/framework/zod"

const csv = (max: number, itemMax = 64) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0 && s.length <= itemMax)
            .slice(0, 20)
        : []
    )

const money = z.coerce.number().int().min(0).max(10_000_000).optional()

export const StoreCatalogParams = z
  .object({
    region_id: z.string().regex(/^reg_[A-Za-z0-9]+$/),
    size: csv(200, 16),
    category_id: csv(600),
    collection_id: csv(600),
    q: z.string().trim().max(80).optional(),
    min_price: money,
    max_price: money,
    in_stock: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v !== "false"),
    order: z
      .enum(["price_asc", "price_desc", "created_at", "title"])
      .default("created_at"),
    limit: z.coerce.number().int().min(1).max(48).default(12),
    offset: z.coerce.number().int().min(0).max(5000).default(0),
  })
  .strict()

export type StoreCatalogParamsType = z.infer<typeof StoreCatalogParams>
