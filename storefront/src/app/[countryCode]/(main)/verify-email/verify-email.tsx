"use client"

import { confirmEmail } from "@lib/data/customer"
import { useI18n } from "@lib/i18n/context"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useEffect, useState } from "react"

/**
 * The token arrives in the URL fragment (#token=…), which is never sent to
 * any server, CDN or log. It's read here, sent once in a POST body, and
 * immediately removed from the address bar/history.
 */
export default function VerifyEmail() {
  const { t } = useI18n()
  const [state, setState] = useState<"checking" | "ok" | "failed">("checking")

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? ""
    window.history.replaceState(null, "", window.location.pathname)
    confirmEmail(token).then((ok) => setState(ok ? "ok" : "failed"))
  }, [])

  return (
    <div className="content-container max-w-xl py-28 text-center">
      <h1 className="heading-md">
        {state === "checking" ? t.account.verifyChecking : state === "ok" ? t.account.verifySuccess : t.account.verifyFailed}
      </h1>
      {state !== "checking" && (
        <LocalizedClientLink href="/account" className="btn-primary mt-8">
          {t.nav.account}
        </LocalizedClientLink>
      )}
    </div>
  )
}
