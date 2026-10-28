import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ShoppingCart } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  toast,
  Toaster,
} from "@medusajs/ui"
import { useEffect, useMemo, useRef, useState } from "react"

type Variant = {
  id: string
  title: string
  sku: string | null
  manage_inventory?: boolean
  price: number | null
  /** null = not tracked */
  available: number | null
}

type Product = {
  id: string
  title: string
  thumbnail: string | null
  variants: Variant[]
}

type CartLine = {
  variant: Variant
  product: Product
  quantity: number
}

const taka = (n: number) => `৳${n.toLocaleString("en-IN")}`
const priceOf = (v: Variant) => v.price ?? 0

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json?.message || `Request failed (${res.status})`)
  }
  return json as T
}

/**
 * Point-of-sale screen for the physical Tantush shop.
 * Search (or scan a barcode = SKU), add sizes, take cash, record the sale.
 * Stock is shared with the website, so online customers can never buy a
 * piece that was just sold over the counter.
 */
const PosPage = () => {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [cart, setCart] = useState<CartLine[]>([])
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [note, setNote] = useState("")
  const [cashReceived, setCashReceived] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      setResults([])
      return
    }
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ q: term })
        const { products } = await api<{ products: Product[] }>(
          `/admin/pos/products?${params}`,
          { signal: ctrl.signal }
        )
        setResults(products)

        // Barcode scanners type the SKU then Enter: auto-add exact SKU matches.
        const exact = products
          .flatMap((p) => p.variants.map((v) => ({ p, v })))
          .find(({ v }) => v.sku?.toLowerCase() === term.toLowerCase())
        if (exact) {
          addToCart(exact.p, exact.v)
          setQ("")
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          toast.error((e as Error).message)
        }
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const addToCart = (product: Product, variant: Variant) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.variant.id === variant.id)
      if (existing) {
        return prev.map((l) =>
          l.variant.id === variant.id ? { ...l, quantity: l.quantity + 1 } : l
        )
      }
      return [...prev, { product, variant, quantity: 1 }]
    })
  }

  const setQty = (variantId: string, quantity: number) => {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.variant.id !== variantId)
        : prev.map((l) => (l.variant.id === variantId ? { ...l, quantity } : l))
    )
  }

  const total = useMemo(
    () => cart.reduce((sum, l) => sum + priceOf(l.variant) * l.quantity, 0),
    [cart]
  )
  const change = Number(cashReceived || 0) - total

  const submit = async () => {
    if (!cart.length) return
    setSubmitting(true)
    try {
      const { order } = await api<{ order: { id: string; display_id: number } }>(
        "/admin/pos/orders",
        {
          method: "POST",
          body: JSON.stringify({
            items: cart.map((l) => ({ variant_id: l.variant.id, quantity: l.quantity })),
            customer_name: customerName || undefined,
            customer_phone: customerPhone || undefined,
            note: note || undefined,
          }),
        }
      )
      toast.success(`Sale recorded — order #${order.display_id}`, {
        description: "Stock has been updated for the website too.",
      })
      setCart([])
      setCustomerName("")
      setCustomerPhone("")
      setNote("")
      setCashReceived("")
      searchRef.current?.focus()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Toaster />
      <Container className="p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">Showroom POS</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Record walk-in sales. Scan a barcode or search by name / SKU.
            </Text>
          </div>
          <Badge color="green">Shared stock with website</Badge>
        </div>
      </Container>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_380px]">
        <Container className="flex flex-col gap-y-4 px-6 py-4">
          <Input
            ref={searchRef}
            autoFocus
            type="search"
            placeholder="Search panjabi or scan SKU (e.g. TNT-NKB-40)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {loading && <Text size="small">Searching…</Text>}
          <div className="flex flex-col gap-y-3">
            {results.map((p) => (
              <div key={p.id} className="flex gap-x-4 rounded-lg border p-3">
                {p.thumbnail && (
                  <img
                    src={p.thumbnail}
                    alt=""
                    className="h-20 w-16 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <Text weight="plus">{p.title}</Text>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.variants.map((v) => {
                      const inCart =
                        cart.find((l) => l.variant.id === v.id)?.quantity ?? 0
                      const out =
                        v.available !== null && v.available - inCart <= 0
                      return (
                        <Button
                          key={v.id}
                          size="small"
                          variant="secondary"
                          disabled={out}
                          onClick={() => addToCart(p, v)}
                          title={v.sku ?? ""}
                        >
                          {v.title} · {taka(priceOf(v))}
                          {v.available !== null && (
                            <span className="text-ui-fg-muted ml-1">
                              ({v.available - inCart})
                            </span>
                          )}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>

        <Container className="flex flex-col gap-y-4 px-6 py-4">
          <Heading level="h2">Current sale</Heading>
          {!cart.length && (
            <Text size="small" className="text-ui-fg-subtle">
              No items yet.
            </Text>
          )}
          {cart.map((l) => (
            <div key={l.variant.id} className="flex items-center justify-between gap-x-2">
              <div className="min-w-0">
                <Text size="small" weight="plus" className="truncate">
                  {l.product.title}
                </Text>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Size {l.variant.title} · {taka(priceOf(l.variant))}
                </Text>
              </div>
              <div className="flex items-center gap-x-1">
                <Button size="small" variant="transparent" onClick={() => setQty(l.variant.id, l.quantity - 1)}>
                  −
                </Button>
                <Text size="small">{l.quantity}</Text>
                <Button
                  size="small"
                  variant="transparent"
                  disabled={l.variant.available !== null && l.quantity >= l.variant.available}
                  onClick={() => setQty(l.variant.id, l.quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between border-t pt-3">
            <Text weight="plus">Total</Text>
            <Heading level="h2">{taka(total)}</Heading>
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor="cash">Cash received</Label>
            <Input
              id="cash"
              type="number"
              min={0}
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
            />
            {cashReceived && (
              <Text size="small" className={change < 0 ? "text-ui-fg-error" : ""}>
                {change < 0 ? `Short by ${taka(-change)}` : `Change: ${taka(change)}`}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor="cname">Customer name (optional)</Label>
            <Input id="cname" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <Label htmlFor="cphone">Mobile (optional)</Label>
            <Input
              id="cphone"
              inputMode="tel"
              placeholder="01XXXXXXXXX"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <Button
            size="large"
            disabled={!cart.length || submitting || (cashReceived !== "" && change < 0)}
            isLoading={submitting}
            onClick={submit}
          >
            Record cash sale
          </Button>
        </Container>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Showroom POS",
  icon: ShoppingCart,
})

export default PosPage
