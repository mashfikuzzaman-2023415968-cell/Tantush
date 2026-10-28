import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { MedusaError } from "@medusajs/framework/utils"
import {
  BD_PHONE_REGEX,
  COD_MAX_ORDER_TOTAL,
  MAX_QTY_PER_LINE,
  normalizeBdPhone,
} from "../../lib/constants"

/**
 * Cash-on-delivery safety checks, run inside Medusa's own checkout workflow
 * right before the order is created. Because this is server side, it can't be
 * bypassed by calling the API directly.
 */
completeCartWorkflow.hooks.validate(async ({ cart }) => {
  const c = cart as any
  const fail = (message: string) => {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, message)
  }

  const address = c.shipping_address
  if (!address?.first_name || !address?.address_1 || !address?.city) {
    fail("Please provide your full name and delivery address.")
  }

  const phone = normalizeBdPhone(address?.phone)
  if (!BD_PHONE_REGEX.test(phone)) {
    fail("Please provide a valid Bangladeshi mobile number (e.g. 01712345678) so the courier can reach you.")
  }

  if (address?.country_code && address.country_code.toLowerCase() !== "bd") {
    fail("We currently deliver within Bangladesh only.")
  }

  for (const item of c.items ?? []) {
    if (Number(item.quantity) > MAX_QTY_PER_LINE) {
      fail(`You can order up to ${MAX_QTY_PER_LINE} pieces of an item at a time.`)
    }
  }

  if (Number(c.total) > COD_MAX_ORDER_TOTAL) {
    fail(
      `Cash on delivery orders are limited to ৳${COD_MAX_ORDER_TOTAL.toLocaleString("en-US")}. Please contact us for larger orders.`
    )
  }

  // "Inside Dhaka" rate is only valid for Dhaka addresses.
  const method = (c.shipping_methods ?? [])[0]
  const methodName = String(method?.name ?? "").toLowerCase()
  const city = `${address?.city ?? ""} ${address?.province ?? ""}`.toLowerCase()
  if (methodName.includes("inside dhaka") && !/dhaka|ঢাকা/.test(city)) {
    fail("'Inside Dhaka' delivery is only for Dhaka addresses. Please choose 'Outside Dhaka'.")
  }
})
