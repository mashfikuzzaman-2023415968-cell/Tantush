import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { getDictionary } from "@lib/i18n/server"
import DetailsForm from "@modules/checkout/components/details-form"
import OrderSummary from "@modules/checkout/components/order-summary"
import ReviewStep from "@modules/checkout/components/review-step"
import Steps from "@modules/checkout/components/steps"
import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
}

export default async function Checkout(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ step?: string }>
}) {
  const [{ countryCode }, { step }] = await Promise.all([props.params, props.searchParams])
  const cart = await retrieveCart()

  if (!cart?.items?.length) {
    redirect(`/${countryCode}/cart`)
  }

  const [customer, shippingOptions, { t }] = await Promise.all([
    retrieveCustomer(),
    listCartShippingMethods(cart.id),
    getDictionary(),
  ])

  // Review is only reachable once address, delivery and COD session exist.
  const ready =
    !!cart.shipping_address?.address_1 &&
    !!cart.shipping_methods?.length &&
    !!cart.payment_collection?.payment_sessions?.some((s) => s.status === "pending")
  const current = step === "review" && ready ? "review" : "details"

  return (
    <div className="content-container py-10 small:py-14">
      <div className="mb-10 flex flex-col small:flex-row small:items-end justify-between gap-6">
        <h1 className="heading-lg">{t.checkout.title}</h1>
        <Steps step={current} />
      </div>
      <div className="grid grid-cols-1 small:grid-cols-[1fr_420px] gap-12 small:gap-16">
        <div className="order-2 small:order-1">
          {current === "review" ? (
            <ReviewStep cart={cart} />
          ) : (
            <DetailsForm cart={cart} customer={customer} shippingOptions={shippingOptions ?? []} />
          )}
        </div>
        <div className="order-1 small:order-2">
          <OrderSummary cart={cart} />
        </div>
      </div>
    </div>
  )
}
