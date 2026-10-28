"use client"

import { useI18n } from "@lib/i18n/context"
import Script from "next/script"
import { useEffect, useRef } from "react"

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id: string) => void
    }
  }
}

/**
 * Bot protection for forms:
 *  - an invisible honeypot field ("website") that only bots fill in, and
 *  - Cloudflare Turnstile (privacy-friendly CAPTCHA, usually no puzzle) when
 *    NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. Turnstile writes its token into a
 *    hidden `cf-turnstile-response` input of the surrounding <form>; the
 *    backend verifies it, so bots can't skip it by calling the API directly.
 */
export default function BotGuard({
  nonce,
  onToken,
  resetKey,
}: {
  nonce?: string
  /** For non-form flows: receive the token directly. */
  onToken?: (token: string | null) => void
  /** Change to request a fresh token (tokens are single-use). */
  resetKey?: unknown
}) {
  const { lang } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  const render = () => {
    if (!SITE_KEY || !ref.current || !window.turnstile || widgetId.current) return
    widgetId.current = window.turnstile.render(ref.current, {
      sitekey: SITE_KEY,
      language: lang === "bn" ? "bn" : "en",
      appearance: "interaction-only",
      callback: (t: string) => onToken?.(t),
      "expired-callback": () => onToken?.(null),
      "error-callback": () => onToken?.(null),
    })
  }

  useEffect(() => {
    render()
    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current)
      widgetId.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (resetKey !== undefined && widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current)
      onToken?.(null)
    }
  }, [resetKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      {SITE_KEY && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            nonce={nonce}
            onLoad={render}
          />
          <div ref={ref} className="mt-4 empty:hidden" />
        </>
      )}
    </>
  )
}
