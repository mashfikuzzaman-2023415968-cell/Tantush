"use server"

import { sdk } from "@lib/config"

export type Showroom = {
  id: string
  name: string
  address_1: string | null
  address_2: string | null
  city: string | null
  postal_code: string | null
  phone: string | null
}

export async function getShowrooms(): Promise<Showroom[]> {
  return sdk.client
    .fetch<{ showrooms: Showroom[] }>("/store/shop-info", {
      method: "GET",
      next: { revalidate: 600 },
      cache: "force-cache",
    })
    .then((r) => r.showrooms)
    .catch(() => [])
}
