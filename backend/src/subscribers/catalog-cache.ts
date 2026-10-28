import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { CATALOG_CACHE_PREFIX } from "../lib/constants"

/**
 * Drops cached /store/catalog and /store/shop-info responses whenever
 * something that affects them changes. The cache TTL (2 min) is the backstop.
 */
export default async function invalidateCatalogCache({ container }: SubscriberArgs) {
  const cache = container.resolve(Modules.CACHE)
  await Promise.all([
    cache.invalidate(`${CATALOG_CACHE_PREFIX}*`),
    cache.invalidate("shop-info:*"),
  ])
}

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
    "product.deleted",
    "product-variant.created",
    "product-variant.updated",
    "product-variant.deleted",
    "product-category.updated",
    "product-collection.updated",
    "price-list.created",
    "price-list.updated",
    "price-list.deleted",
    "price-list.prices_added",
    "price-list.prices_updated",
    "price-list.prices_removed",
    "inventory-level.created",
    "inventory-level.updated",
    "inventory-level.deleted",
    "order.placed",
    "order.canceled",
    "order.fulfillment_created",
    "stock-location.updated",
  ],
  context: { subscriberId: "tantush-catalog-cache" },
}
