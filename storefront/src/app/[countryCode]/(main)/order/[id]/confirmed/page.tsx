import { retrieveOrder } from "@lib/data/orders"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
}

export default async function OrderConfirmedPage(props: Props) {
  const { id } = await props.params
  if (!/^order_[A-Za-z0-9]{10,40}$/.test(id)) notFound()

  const order = await retrieveOrder(id).catch(() => null)
  if (!order) notFound()

  // The backend only includes the address for the buyer (session or signed proof)
  const showPrivate = !!order.shipping_address

  return <OrderCompletedTemplate order={order} showPrivate={showPrivate} />
}
