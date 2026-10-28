import { model } from "@medusajs/framework/utils"

/**
 * One row per customer. Only a SHA-256 hash of the emailed token is stored,
 * so a database leak can't be used to verify addresses.
 */
export const EmailVerification = model.define("email_verification", {
  id: model.id({ prefix: "emv" }).primaryKey(),
  customer_id: model.text().unique(),
  email: model.text(),
  token_hash: model.text().nullable(),
  expires_at: model.dateTime().nullable(),
  verified_at: model.dateTime().nullable(),
})
