import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

const THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD || 3)

/**
 * Every morning at 9:00 (Asia/Dhaka = 03:00 UTC) list sizes that are running
 * low so the shop can restock popular items before they sell out.
 */
export default async function lowStockAlert(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const notifications = container.resolve(Modules.NOTIFICATION)

  const { data: levels } = await query.graph({
    entity: "inventory_level",
    fields: [
      "stocked_quantity",
      "reserved_quantity",
      "inventory_item.sku",
      "inventory_item.title",
    ],
  })

  const low = (levels as any[])
    .map((l) => ({
      sku: l.inventory_item?.sku,
      title: l.inventory_item?.title,
      available: Number(l.stocked_quantity) - Number(l.reserved_quantity),
    }))
    .filter((l) => l.available <= THRESHOLD)
    .sort((a, b) => a.available - b.available)

  if (!low.length) {
    return
  }

  const lines = low.map((l) => `${l.sku ?? l.title}: ${l.available}`).join("\n")
  logger.warn(`[low-stock] ${low.length} item(s) at or below ${THRESHOLD}:\n${lines}`)

  await notifications.createNotifications({
    to: "admin",
    channel: "feed",
    template: "admin-ui",
    data: {
      title: `Low stock: ${low.length} size(s)`,
      description: lines.slice(0, 900),
    },
  })
}

export const config = {
  name: "tantush-low-stock-alert",
  schedule: "0 3 * * *",
}
