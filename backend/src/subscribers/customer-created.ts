import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendVerificationEmail } from "../lib/email-verification"

/** Sends the "verify your email" message when a customer registers. */
export default async function customerCreated({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "has_account"],
    filters: { id: data.id },
  })
  // Guest checkouts also create customer records — only real accounts get mail
  if (!customer?.has_account || !customer.email || customer.email.endsWith(".invalid")) return
  await sendVerificationEmail(container, customer as any)
}

export const config: SubscriberConfig = {
  event: "customer.created",
  context: { subscriberId: "tantush-customer-verify-email" },
}
