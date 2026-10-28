import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { EMAIL_VERIFICATION_MODULE } from "../../../../../modules/email-verification"
import type EmailVerificationModuleService from "../../../../../modules/email-verification/service"
import { sendVerificationEmail } from "../../../../../lib/email-verification"

async function currentCustomer(req: AuthenticatedMedusaRequest) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name"],
    filters: { id: req.auth_context.actor_id },
  })
  return customer as { id: string; email: string; first_name: string | null } | undefined
}

/** GET /store/customers/me/email-verification → { verified } */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customer = await currentCustomer(req)
  if (!customer) return res.status(401).json({ message: "Unauthorized" })
  const service = req.scope.resolve<EmailVerificationModuleService>(EMAIL_VERIFICATION_MODULE)
  res.json({ verified: await service.isVerified(customer.id, customer.email) })
}

/** POST /store/customers/me/email-verification → re-send the verification email */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customer = await currentCustomer(req)
  if (!customer) return res.status(401).json({ message: "Unauthorized" })
  const service = req.scope.resolve<EmailVerificationModuleService>(EMAIL_VERIFICATION_MODULE)
  if (await service.isVerified(customer.id, customer.email)) {
    return res.json({ verified: true })
  }
  await sendVerificationEmail(req.scope, customer)
  // Same response whether or not mail delivery works — nothing to enumerate
  res.status(202).json({ sent: true })
}
