import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createOrderFulfillmentWorkflow,
  createOrderPaymentCollectionWorkflow,
  createOrderWorkflow,
  completeOrderWorkflow,
  createReservationsWorkflow,
  markOrderFulfillmentAsDeliveredWorkflow,
  markPaymentCollectionAsPaid,
} from "@medusajs/medusa/core-flows"

export type CreatePosSaleInput = {
  region_id: string
  sales_channel_id: string
  location_id: string
  shipping_option_id: string
  currency_code: string
  items: { variant_id: string; quantity: number }[]
  /** variant_id -> inventory items it consumes */
  inventory: Record<string, { inventory_item_id: string; required_quantity: number }[]>
  customer_name?: string
  customer_phone?: string
  email?: string
  note?: string
  created_by: string
}

/**
 * Records a walk-in sale at the physical shop as a regular Medusa order on the
 * "Tantush Showroom" sales channel: creates the order, reserves stock, marks
 * it paid (cash at counter), fulfils it, marks it delivered and completed — so the shared
 * inventory used by the website goes down immediately and reports include
 * offline + online sales together.
 *
 * Each sub-workflow has compensation, so a failure part-way rolls back.
 */
export const createPosSaleWorkflow = createWorkflow(
  "tantush-create-pos-sale",
  (input: CreatePosSaleInput) => {
    const orderInput = transform({ input }, ({ input }) => {
      const [first_name, ...rest] = (input.customer_name || "Walk-in").trim().split(/\s+/)
      return {
        region_id: input.region_id,
        sales_channel_id: input.sales_channel_id,
        currency_code: input.currency_code,
        email: input.email || undefined,
        status: "pending" as const,
        items: input.items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
        shipping_address: {
          first_name,
          last_name: rest.join(" ") || "Customer",
          phone: input.customer_phone || undefined,
          address_1: "In-store purchase",
          city: "Dhaka",
          country_code: "bd",
        },
        shipping_methods: [
          {
            name: "In-store sale",
            amount: 0,
            shipping_option_id: input.shipping_option_id,
          },
        ],
        no_notification: true,
        metadata: {
          source: "pos",
          note: input.note || null,
          recorded_by: input.created_by,
        },
      }
    })

    const order = createOrderWorkflow.runAsStep({ input: orderInput as any })

    const reservations = transform({ order, input }, ({ order, input }) => ({
      reservations: (order.items ?? []).flatMap((item: any) =>
        (input.inventory[item.variant_id] ?? []).map((inv) => ({
          line_item_id: item.id,
          inventory_item_id: inv.inventory_item_id,
          location_id: input.location_id,
          quantity: Number(item.quantity) * (inv.required_quantity || 1),
          description: "POS sale",
        }))
      ),
    }))
    createReservationsWorkflow.runAsStep({ input: reservations })

    const paymentCollectionInput = transform({ order }, ({ order }) => ({
      order_id: order.id,
      amount: Number((order as any).total),
    }))
    const paymentCollections = createOrderPaymentCollectionWorkflow.runAsStep({
      input: paymentCollectionInput,
    })

    const markPaidInput = transform(
      { order, paymentCollections, input },
      ({ order, paymentCollections, input }) => ({
        order_id: order.id,
        payment_collection_id: paymentCollections[0].id,
        captured_by: input.created_by,
      })
    )
    markPaymentCollectionAsPaid.runAsStep({ input: markPaidInput })

    const fulfillmentInput = transform({ order, input }, ({ order, input }) => ({
      order_id: order.id,
      location_id: input.location_id,
      created_by: input.created_by,
      no_notification: true,
      items: (order.items ?? []).map((i: any) => ({ id: i.id, quantity: Number(i.quantity) })),
    }))
    const fulfillment = createOrderFulfillmentWorkflow.runAsStep({
      input: fulfillmentInput,
    })

    const deliveredInput = transform({ order, fulfillment }, ({ order, fulfillment }) => ({
      orderId: order.id,
      fulfillmentId: fulfillment.id,
      no_notification: true,
    }))
    markOrderFulfillmentAsDeliveredWorkflow.runAsStep({ input: deliveredInput })

    const completeInput = transform({ order }, ({ order }) => ({ orderIds: [order.id] }))
    completeOrderWorkflow.runAsStep({ input: completeInput })

    return new WorkflowResponse(order)
  }
)
