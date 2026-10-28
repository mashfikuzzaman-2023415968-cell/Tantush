import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Bag",
  robots: { index: false },
}

export default async function Cart() {
  const [cart, customer] = await Promise.all([
    retrieveCart().catch(() => null),
    retrieveCustomer().catch(() => null),
  ])
  return <CartTemplate cart={cart} customer={customer} />
}
