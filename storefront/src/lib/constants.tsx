import React from "react"

/* Map of payment provider_id to its label. Tantush only offers cash on delivery,
   served by Medusa's built-in manual provider. */
export const paymentInfoMap: Record<string, { title: string; icon: React.JSX.Element }> = {
  pp_system_default: {
    title: "Cash on delivery",
    icon: <span aria-hidden>৳</span>,
  },
}

export const isManual = (providerId?: string) => providerId?.startsWith("pp_system_default")

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = ["krw", "jpy", "vnd", "clp", "pyg", "xaf", "xof", "bif", "djf", "gnf", "kmf", "mga", "rwf", "xpf", "htg", "vuv", "xag", "xdr", "xau"]
