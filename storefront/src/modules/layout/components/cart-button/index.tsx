import { retrieveCart } from "@lib/data/cart"
import CartDrawer from "../cart-drawer"

export default async function CartButton() {
  const cart = await retrieveCart().catch(() => null)
  return <CartDrawer cart={cart} />
}
