/** Business rules for cash-on-delivery orders. Tune via env without code changes. */
export const MAX_QTY_PER_LINE = Number(process.env.MAX_QTY_PER_LINE || 10)
export const COD_MAX_ORDER_TOTAL = Number(process.env.COD_MAX_ORDER_TOTAL || 50000)

/** Bangladeshi mobile numbers: 01XXXXXXXXX, optionally prefixed with +88 / 88. */
export const BD_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/

export const normalizeBdPhone = (phone?: string | null) =>
  (phone ?? "").replace(/[\s-]/g, "")

export const CATALOG_CACHE_PREFIX = "catalog:"
