import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Notifies the shop when a new order arrives. With the default "local"
 * notification provider this is written to the server log; plug in an SMS
 * (e.g. SSL Wireless / BulkSMSBD) or email provider in medusa-config.ts to
 * deliver it to the owner's phone.
 */
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const notifications = container.resolve(Modules.NOTIFICATION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "total",
      "currency_code",
      "sales_channel.name",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.phone",
      "shipping_address.city",
      "items.title",
      "items.variant_title",
      "items.quantity",
    ],
    filters: { id: data.id },
  })
  // POS sales are recorded by staff at the counter; no alert needed. Decided by
  // sales channel (server-controlled), never by client-writable metadata.
  const showroomChannel = process.env.POS_SALES_CHANNEL_NAME || "Tantush Showroom"
  if (!order || (order as any).sales_channel?.name === showroomChannel) {
    return
  }

  const o = order as any
  const summary = (o.items ?? [])
    .map((i: any) => `${i.quantity}× ${i.title} (${i.variant_title})`)
    .join(", ")

  const payload = {
    order_id: o.id,
    display_id: o.display_id,
    customer: `${o.shipping_address?.first_name ?? ""} ${o.shipping_address?.last_name ?? ""}`.trim(),
    phone: o.shipping_address?.phone,
    city: o.shipping_address?.city,
    total: Number(o.total),
    currency_code: o.currency_code,
    items: summary,
  }

  try {
    const shopTo = process.env.SHOP_NOTIFY_TO
    await notifications.createNotifications([
      ...(shopTo
        ? [
            {
              to: shopTo,
              channel: process.env.SHOP_NOTIFY_CHANNEL || "sms",
              template: "shop-new-order",
              data: payload,
            },
          ]
        : []),
      // Guests without email get a reserved ".invalid" placeholder — never mail it
      ...(o.email && !String(o.email).endsWith(".invalid")
        ? [
            {
              to: o.email,
              channel: "email",
              template: "customer-order-confirmation",
              data: payload,
            },
          ]
        : []),
      {
        to: "admin",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: `New COD order #${o.display_id}`,
          description: `${payload.customer} · ${payload.city} · ৳${payload.total} — ${summary}`,
        },
      },
    ])
  } catch (e) {
    logger.error(`[order-placed] notification failed for ${o.id}: ${(e as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
  context: { subscriberId: "tantush-order-placed" },
}
