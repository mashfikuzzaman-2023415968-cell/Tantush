import { Metadata } from "next"

import Overview from "@modules/account/components/overview"
import { notFound } from "next/navigation"
import { getEmailVerified, retrieveCustomer } from "@lib/data/customer"
import VerifyEmailBanner from "@modules/account/components/verify-email-banner"
import { listOrders } from "@lib/data/orders"

export const metadata: Metadata = {
  title: "Account",
  description: "Overview of your account activity.",
}

export default async function OverviewTemplate() {
  const [customer, orders, verified] = await Promise.all([
    retrieveCustomer().catch(() => null),
    listOrders().catch(() => null),
    getEmailVerified(),
  ])

  if (!customer) {
    notFound()
  }

  return (
    <>
      {verified === false && <VerifyEmailBanner />}
      <Overview customer={customer} orders={orders} />
    </>
  )
}
