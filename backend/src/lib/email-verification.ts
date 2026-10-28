import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { EMAIL_VERIFICATION_MODULE } from "../modules/email-verification"
import type EmailVerificationModuleService from "../modules/email-verification/service"

const STOREFRONT_URL = (process.env.STOREFRONT_URL || "http://localhost:8000").replace(/\/$/, "")

/**
 * Issues a fresh token and emails a link. The token travels in the URL
 * *fragment* (#…), which browsers never send to servers — so it can't end
 * up in nginx/CDN/access logs or Referer headers.
 */
export async function sendVerificationEmail(
  container: MedusaContainer,
  customer: { id: string; email: string; first_name?: string | null }
) {
  const service = container.resolve<EmailVerificationModuleService>(EMAIL_VERIFICATION_MODULE)
  const token = await service.issueToken(customer.id, customer.email)
  await container.resolve(Modules.NOTIFICATION).createNotifications({
    to: customer.email,
    channel: "email",
    template: "customer-verify-email",
    data: {
      first_name: customer.first_name ?? "",
      verify_url: `${STOREFRONT_URL}/bd/verify-email#token=${token}`,
    },
  })
}
