"use client"

import { resendVerificationEmail } from "@lib/data/customer"
import { useI18n } from "@lib/i18n/context"
import { useState, useTransition } from "react"

export default function VerifyEmailBanner() {
  const { t } = useI18n()
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle")
  const [pending, start] = useTransition()

  return (
    <div className="mb-8 flex flex-col xsmall:flex-row xsmall:items-center justify-between gap-3 rounded-2xl bg-ivory-200 px-5 py-4 text-sm text-espresso" data-testid="verify-email-banner">
      <span>{status === "sent" ? t.account.verifySent : t.account.verifyBanner}</span>
      {status !== "sent" && (
        <button
          disabled={pending}
          onClick={() => start(async () => setStatus((await resendVerificationEmail()) === "error" ? "error" : "sent"))}
          className="btn-outline h-9 px-4 text-xs"
        >
          {t.account.verifyResend}
        </button>
      )}
    </div>
  )
}
