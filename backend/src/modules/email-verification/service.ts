import { MedusaError, MedusaService } from "@medusajs/framework/utils"
import { createHash, randomBytes } from "crypto"
import { EmailVerification } from "./models/email-verification"

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const sha256 = (v: string) => createHash("sha256").update(v).digest("hex")

class EmailVerificationModuleService extends MedusaService({ EmailVerification }) {
  /** Creates (or rotates) the token for a customer and returns the raw token once. */
  async issueToken(customerId: string, email: string): Promise<string> {
    const token = randomBytes(32).toString("base64url")
    const data = {
      email: email.toLowerCase(),
      token_hash: sha256(token),
      expires_at: new Date(Date.now() + TOKEN_TTL_MS),
      verified_at: null,
    }
    const [existing] = await this.listEmailVerifications({ customer_id: customerId })
    if (existing) {
      await this.updateEmailVerifications({ id: existing.id, ...data })
    } else {
      await this.createEmailVerifications({ customer_id: customerId, ...data })
    }
    return token
  }

  /** Marks the matching customer verified. Tokens are single use. */
  async confirm(token: string): Promise<{ customer_id: string }> {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid or expired link")
    }
    const [row] = await this.listEmailVerifications({ token_hash: sha256(token) })
    if (!row || !row.expires_at || new Date(row.expires_at).getTime() < Date.now()) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid or expired link")
    }
    await this.updateEmailVerifications({
      id: row.id,
      verified_at: new Date(),
      token_hash: null,
      expires_at: null,
    })
    return { customer_id: row.customer_id }
  }

  async isVerified(customerId: string, email: string): Promise<boolean> {
    const [row] = await this.listEmailVerifications({ customer_id: customerId })
    // Changing the email invalidates the previous verification
    return !!row?.verified_at && row.email === email.toLowerCase()
  }
}

export default EmailVerificationModuleService
