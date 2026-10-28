import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

/**
 * Formats a money amount. Taka is shown the way Bangladeshi shoppers expect:
 * "৳3,450" / "৳1,25,000" (lakh grouping, no decimals for whole amounts).
 */
export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "en-US",
}: ConvertToLocaleParams) => {
  if (!currency_code || isEmpty(currency_code)) {
    return amount.toString()
  }

  if (currency_code.toLowerCase() === "bdt") {
    const value = Number(amount) || 0
    const isWhole = Number.isInteger(value)
    const formatted = new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: minimumFractionDigits ?? (isWhole ? 0 : 2),
      maximumFractionDigits: maximumFractionDigits ?? (isWhole ? 0 : 2),
    }).format(Math.abs(value))
    return `${value < 0 ? "-" : ""}৳${formatted}`
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency_code,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount)
}
