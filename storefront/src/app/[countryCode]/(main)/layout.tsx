import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"

export default async function PageLayout(props: { children: React.ReactNode }) {
  const [customer, cart] = await Promise.all([retrieveCustomer(), retrieveCart()])

  return (
    <>
      <Nav />
      {customer && cart && <CartMismatchBanner customer={customer} cart={cart} />}
      {props.children}
      <Footer />
    </>
  )
}
