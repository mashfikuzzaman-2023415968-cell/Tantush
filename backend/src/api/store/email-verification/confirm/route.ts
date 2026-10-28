import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { EMAIL_VERIFICATION_MODULE } from "../../../../modules/email-verification"
import type EmailVerificationModuleService from "../../../../modules/email-verification/service"
import type { ConfirmEmailType } from "./validators"

/** POST /store/email-verification/confirm { token } */
export async function POST(req: MedusaRequest<ConfirmEmailType>, res: MedusaResponse) {
  const service = req.scope.resolve<EmailVerificationModuleService>(EMAIL_VERIFICATION_MODULE)
  await service.confirm(req.validatedBody.token)
  res.json({ verified: true })
}
