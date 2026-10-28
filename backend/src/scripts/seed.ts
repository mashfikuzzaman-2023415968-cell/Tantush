import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createPriceListsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createPromotionsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  createTranslationsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Tantush seed — Bangladesh store, BDT pricing, cash on delivery,
 * an online channel and a showroom (offline / POS) channel that share
 * one inventory, and a starter panjabi catalogue in English + Bangla.
 *
 * Run once on an empty database:  npm run seed
 */

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const img = (name: string) => ({ url: `${BACKEND_URL}/static/seed/${name}.webp` })

const SIZES = ["38", "40", "42", "44", "46"]

type SeedProduct = {
  handle: string
  title: string
  title_bn: string
  subtitle: string
  subtitle_bn: string
  description: string
  description_bn: string
  material: string
  material_bn: string
  price: number
  category: string
  collection?: string
  images: string[]
  skuPrefix: string
  // stock per size, same order as SIZES
  stock: number[]
}

const PRODUCTS: SeedProduct[] = [
  {
    handle: "noksha-black-embroidered-panjabi",
    title: "Noksha Black Embroidered Panjabi",
    title_bn: "নকশা কালো এমব্রয়ডারি পাঞ্জাবি",
    subtitle: "Hand-finished geometric placket embroidery",
    subtitle_bn: "হাতে ফিনিশ করা জ্যামিতিক প্ল্যাকেট এমব্রয়ডারি",
    description:
      "A deep black panjabi with an ivory geometric embroidery panel framing the placket and a matching band collar. Tailored in breathable premium cotton for Eid prayers, weddings and evening gatherings.",
    description_bn:
      "গভীর কালো রঙের পাঞ্জাবি, প্ল্যাকেট ঘিরে আইভরি জ্যামিতিক এমব্রয়ডারি প্যানেল এবং মিলিয়ে করা বেন্ড কলার। ঈদের নামাজ, বিয়ে ও সন্ধ্যার আয়োজনের জন্য আরামদায়ক প্রিমিয়াম কটনে তৈরি।",
    material: "Premium cotton",
    material_bn: "প্রিমিয়াম কটন",
    price: 3450,
    category: "Embroidered",
    collection: "Eid Collection",
    images: ["panjabi-black-embroidered-1", "panjabi-black-embroidered-2"],
    skuPrefix: "TNT-NKB",
    stock: [6, 12, 15, 9, 4],
  },
  {
    handle: "marble-ivory-printed-panjabi",
    title: "Marble Ivory Printed Panjabi",
    title_bn: "মার্বেল আইভরি প্রিন্টেড পাঞ্জাবি",
    subtitle: "Soft-grey watercolour marble print",
    subtitle_bn: "নরম ধূসর জলরঙা মার্বেল প্রিন্ট",
    description:
      "An airy ivory panjabi printed with a soft grey marble motif. Lightweight cotton-viscose blend that drapes well and stays cool through long summer days.",
    description_bn:
      "নরম ধূসর মার্বেল মোটিফে প্রিন্ট করা হালকা আইভরি পাঞ্জাবি। কটন-ভিসকস মিশ্রণের হালকা কাপড়, গ্রীষ্মের দীর্ঘ দিনেও শীতল ও আরামদায়ক।",
    material: "Cotton-viscose blend",
    material_bn: "কটন-ভিসকস মিশ্রণ",
    price: 2650,
    category: "Printed",
    collection: "Summer Breeze",
    images: ["panjabi-ivory-print-1", "panjabi-ivory-print-2"],
    skuPrefix: "TNT-MIV",
    stock: [8, 14, 18, 10, 0],
  },
  {
    handle: "chocolate-heritage-cotton-panjabi",
    title: "Chocolate Heritage Cotton Panjabi",
    title_bn: "চকলেট হেরিটেজ কটন পাঞ্জাবি",
    subtitle: "Timeless solid with tonal piping",
    subtitle_bn: "টোনাল পাইপিং সহ চিরন্তন সলিড",
    description:
      "A rich chocolate-brown panjabi with tonal piping on the collar and cuffs. A versatile everyday classic that pairs with white pyjama or denim alike.",
    description_bn:
      "কলার ও কাফে টোনাল পাইপিং সহ গাঢ় চকলেট-বাদামি পাঞ্জাবি। সাদা পায়জামা কিংবা ডেনিম — সবকিছুর সাথেই মানানসই প্রতিদিনের ক্লাসিক।",
    material: "Combed cotton",
    material_bn: "কম্বড কটন",
    price: 2250,
    category: "Solid Classics",
    collection: "Eid Collection",
    images: ["panjabi-chocolate-1", "panjabi-chocolate-2"],
    skuPrefix: "TNT-CHC",
    stock: [10, 16, 20, 12, 6],
  },
  {
    handle: "midnight-jamdani-motif-panjabi",
    title: "Midnight Jamdani-Motif Panjabi",
    title_bn: "মিডনাইট জামদানি-মোটিফ পাঞ্জাবি",
    subtitle: "Jamdani-inspired weave on the collar",
    subtitle_bn: "কলারে জামদানি অনুপ্রাণিত বুনন",
    description:
      "Our signature festive piece — midnight black cotton silk with a Jamdani-inspired motif woven along the collar and placket. Made in limited batches.",
    description_bn:
      "আমাদের সিগনেচার উৎসবের পোশাক — মিডনাইট কালো কটন সিল্কে কলার ও প্ল্যাকেট বরাবর জামদানি অনুপ্রাণিত মোটিফ। সীমিত সংখ্যায় তৈরি।",
    material: "Cotton silk",
    material_bn: "কটন সিল্ক",
    price: 4200,
    category: "Embroidered",
    collection: "Eid Collection",
    images: ["panjabi-black-embroidered-2", "panjabi-black-embroidered-1"],
    skuPrefix: "TNT-MJM",
    stock: [3, 5, 7, 5, 2],
  },
  {
    handle: "ivory-festive-panjabi",
    title: "Ivory Festive Panjabi",
    title_bn: "আইভরি ফেস্টিভ পাঞ্জাবি",
    subtitle: "Printed festive cut, relaxed fit",
    subtitle_bn: "উৎসবের প্রিন্টেড কাট, আরামদায়ক ফিট",
    description:
      "A relaxed-fit ivory panjabi with an all-over abstract print and concealed placket — light, festive and easy to wear all day.",
    description_bn:
      "পুরো জুড়ে অ্যাবস্ট্রাক্ট প্রিন্ট ও লুকানো প্ল্যাকেট সহ আরামদায়ক ফিটের আইভরি পাঞ্জাবি — হালকা, উৎসবমুখর এবং সারাদিন পরার উপযোগী।",
    material: "Cotton",
    material_bn: "কটন",
    price: 2950,
    category: "Printed",
    collection: "Summer Breeze",
    images: ["panjabi-ivory-print-2", "panjabi-ivory-print-1"],
    skuPrefix: "TNT-IFP",
    stock: [7, 11, 13, 8, 5],
  },
  {
    handle: "mocha-classic-solid-panjabi",
    title: "Mocha Classic Solid Panjabi",
    title_bn: "মোকা ক্লাসিক সলিড পাঞ্জাবি",
    subtitle: "The everyday essential",
    subtitle_bn: "প্রতিদিনের অপরিহার্য",
    description:
      "A clean mocha panjabi in soft-washed cotton with a short band collar. The panjabi you will reach for every Friday.",
    description_bn:
      "নরম ধোয়া কটনে শর্ট বেন্ড কলার সহ পরিচ্ছন্ন মোকা রঙের পাঞ্জাবি। প্রতি শুক্রবার যে পাঞ্জাবিটি আপনি বেছে নেবেন।",
    material: "Soft-washed cotton",
    material_bn: "সফট-ওয়াশড কটন",
    price: 1950,
    category: "Solid Classics",
    images: ["panjabi-chocolate-2", "panjabi-chocolate-1"],
    skuPrefix: "TNT-MCS",
    stock: [12, 18, 22, 14, 8],
  },
]

const CATEGORIES = [
  { name: "Embroidered", name_bn: "এমব্রয়ডারি", handle: "embroidered" },
  { name: "Printed", name_bn: "প্রিন্টেড", handle: "printed" },
  { name: "Solid Classics", name_bn: "সলিড ক্লাসিক", handle: "solid-classics" },
]

const COLLECTIONS = [
  { title: "Eid Collection", title_bn: "ঈদ কালেকশন", handle: "eid-collection" },
  { title: "Summer Breeze", title_bn: "সামার ব্রিজ", handle: "summer-breeze" },
]

const updateStoreCurrencies = createWorkflow(
  "tantush-update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[]
    store_id: string
  }) => {
    const normalizedInput = transform({ input }, (data) => ({
      selector: { id: data.input.store_id },
      update: {
        supported_currencies: data.input.supported_currencies.map((c) => ({
          currency_code: c.currency_code,
          is_default: c.is_default ?? false,
        })),
      },
    }))

    return new WorkflowResponse(updateStoresStep(normalizedInput))
  }
)

export default async function seedTantush({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const storeModuleService = container.resolve(Modules.STORE)
  const regionModuleService = container.resolve(Modules.REGION)

  const existing = await regionModuleService.listRegions({ name: "Bangladesh" })
  if (existing.length) {
    logger.warn("Tantush seed already applied (region 'Bangladesh' exists). Skipping.")
    return
  }

  // ---------------------------------------------------------------- store
  logger.info("Seeding store, sales channels and locales...")
  const [store] = await storeModuleService.listStores()

  // Rename the default channel created by Medusa to the online shop
  let [onlineChannel] = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  })
  if (onlineChannel) {
    onlineChannel = await salesChannelModuleService.updateSalesChannels(
      onlineChannel.id,
      { name: "Tantush Online", description: "Website orders (cash on delivery)" }
    )
  }

  const { result: newChannels } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        ...(onlineChannel
          ? []
          : [{ name: "Tantush Online", description: "Website orders (cash on delivery)" }]),
        {
          name: "Tantush Showroom",
          description: "Walk-in / offline sales recorded at the physical shop",
        },
      ],
    },
  })
  onlineChannel = onlineChannel ?? newChannels.find((c) => c.name === "Tantush Online")!
  const showroomChannel = newChannels.find((c) => c.name === "Tantush Showroom")!

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [{ currency_code: "bdt", is_default: true }],
    },
  })

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: "Tantush",
        default_sales_channel_id: onlineChannel.id,
        supported_locales: [{ locale_code: "en-US" }, { locale_code: "bn-BD" }],
      },
    },
  })

  // --------------------------------------------------------------- region
  logger.info("Seeding region and tax...")
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Bangladesh",
          currency_code: "bdt",
          countries: ["bd"],
          // Built-in manual provider == Cash on Delivery
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  })
  const region = regionResult[0]

  // Shelf prices are VAT-inclusive, so no extra tax is added at checkout.
  await createTaxRegionsWorkflow(container).run({
    input: [{ country_code: "bd", provider_id: "tp_system" }],
  })

  // -------------------------------------------------------- stock location
  logger.info("Seeding showroom stock location...")
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Tantush Flagship Showroom",
          address: {
            address_1: "Update this address in Admin → Settings → Locations",
            city: "Dhaka",
            country_code: "BD",
            postal_code: "1205",
          },
        },
      ],
    },
  })
  const showroom = stockLocationResult[0]

  await updateStoresWorkflow(container).run({
    input: { selector: { id: store.id }, update: { default_location_id: showroom.id } },
  })

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: showroom.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })

  // One shared inventory for the website and the physical shop
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: showroom.id, add: [onlineChannel.id, showroomChannel.id] },
  })

  // ------------------------------------------------------------ fulfillment
  logger.info("Seeding delivery options...")
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  })
  let shippingProfile = shippingProfiles[0]
  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Default Shipping Profile", type: "default" }] },
    })
    shippingProfile = result[0]
  }

  const deliverySet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Tantush Home Delivery",
    type: "shipping",
    service_zones: [
      { name: "Bangladesh", geo_zones: [{ country_code: "bd", type: "country" }] },
    ],
  })

  const pickupSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Tantush Showroom Pickup",
    type: "pickup",
    service_zones: [
      { name: "Showroom", geo_zones: [{ country_code: "bd", type: "country" }] },
    ],
  })

  for (const set of [deliverySet, pickupSet]) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: showroom.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: set.id },
    })
  }

  const storeRules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ]

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Inside Dhaka",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: deliverySet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Inside Dhaka",
          description: "Delivered in 1–2 days. Pay cash on delivery.",
          code: "inside-dhaka",
        },
        prices: [
          { currency_code: "bdt", amount: 70 },
          { region_id: region.id, amount: 70 },
        ],
        rules: storeRules,
      },
      {
        name: "Outside Dhaka",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: deliverySet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Outside Dhaka",
          description: "Delivered in 2–4 days via courier. Pay cash on delivery.",
          code: "outside-dhaka",
        },
        prices: [
          { currency_code: "bdt", amount: 130 },
          { region_id: region.id, amount: 130 },
        ],
        rules: storeRules,
      },
      {
        name: "Pick up from showroom",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: pickupSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Showroom pickup",
          description: "Ready within 24 hours. Pay at the counter.",
          code: "showroom-pickup",
        },
        prices: [
          { currency_code: "bdt", amount: 0 },
          { region_id: region.id, amount: 0 },
        ],
        rules: storeRules,
      },
    ],
  })

  // ------------------------------------------------------ publishable key
  logger.info("Seeding publishable API key...")
  const { data: existingKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token"],
    filters: { type: "publishable" },
  })
  let publishableKey = existingKeys?.[0] as { id: string; token: string } | undefined
  if (!publishableKey) {
    const {
      result: [created],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [{ title: "Tantush Storefront", type: "publishable", created_by: "" }],
      },
    })
    publishableKey = created as unknown as { id: string; token: string }
  }
  // Storefront key only exposes the online channel — never the showroom channel.
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: publishableKey.id, add: [onlineChannel.id] },
  })

  // ---------------------------------------------------- categories etc.
  logger.info("Seeding categories, collections and products...")
  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: CATEGORIES.map((c) => ({
        name: c.name,
        handle: c.handle,
        is_active: true,
      })),
    },
  })

  const { result: collectionResult } = await createCollectionsWorkflow(container).run({
    input: {
      collections: COLLECTIONS.map((c) => ({ title: c.title, handle: c.handle })),
    },
  })

  const { result: productResult } = await createProductsWorkflow(container).run({
    input: {
      products: PRODUCTS.map((p) => ({
        title: p.title,
        subtitle: p.subtitle,
        handle: p.handle,
        description: p.description,
        material: p.material,
        status: ProductStatus.PUBLISHED,
        weight: 450,
        origin_country: "bd",
        shipping_profile_id: shippingProfile.id,
        category_ids: [categoryResult.find((c) => c.name === p.category)!.id],
        collection_id: p.collection
          ? collectionResult.find((c) => c.title === p.collection)!.id
          : undefined,
        thumbnail: img(p.images[0]).url,
        images: p.images.map(img),
        options: [{ title: "Size", values: SIZES }],
        variants: SIZES.map((size) => ({
          title: size,
          sku: `${p.skuPrefix}-${size}`,
          manage_inventory: true,
          allow_backorder: false,
          options: { Size: size },
          prices: [{ amount: p.price, currency_code: "bdt" }],
        })),
        sales_channels: [{ id: onlineChannel.id }, { id: showroomChannel.id }],
      })),
    },
  })

  // ------------------------------------------------------------ inventory
  logger.info("Seeding inventory levels...")
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "sku", "inventory_items.inventory_item_id"],
  })
  const stockBySku = new Map<string, number>()
  for (const p of PRODUCTS) {
    SIZES.forEach((size, i) => stockBySku.set(`${p.skuPrefix}-${size}`, p.stock[i]))
  }
  const inventoryLevels: CreateInventoryLevelInput[] = []
  for (const v of variants) {
    for (const item of v.inventory_items ?? []) {
      if (!item?.inventory_item_id) continue
      inventoryLevels.push({
        location_id: showroom.id,
        inventory_item_id: item.inventory_item_id,
        stocked_quantity: stockBySku.get(v.sku ?? "") ?? 0,
      })
    }
  }
  await createInventoryLevelsWorkflow(container).run({
    input: { inventory_levels: inventoryLevels },
  })

  // ------------------------------------------------------- translations
  logger.info("Seeding Bangla translations...")
  const BN = "bn-BD"
  const translations = [
    ...productResult.map((product) => {
      const p = PRODUCTS.find((x) => x.handle === product.handle)!
      return {
        reference: "product",
        reference_id: product.id,
        locale_code: BN,
        translations: {
          title: p.title_bn,
          subtitle: p.subtitle_bn,
          description: p.description_bn,
          material: p.material_bn,
        },
      }
    }),
    ...categoryResult.map((category) => ({
      reference: "product_category",
      reference_id: category.id,
      locale_code: BN,
      translations: { name: CATEGORIES.find((c) => c.name === category.name)!.name_bn },
    })),
    ...collectionResult.map((collection) => ({
      reference: "product_collection",
      reference_id: collection.id,
      locale_code: BN,
      translations: {
        title: COLLECTIONS.find((c) => c.title === collection.title)!.title_bn,
      },
    })),
    {
      reference: "region",
      reference_id: region.id,
      locale_code: BN,
      translations: { name: "বাংলাদেশ" },
    },
  ]
  await createTranslationsWorkflow(container).run({ input: { translations } })

  // --------------------------------------------------- offers & promotions
  logger.info("Seeding Eid offer price list and a welcome promo code...")
  const chocolate = productResult.find(
    (p) => p.handle === "chocolate-heritage-cotton-panjabi"
  )!
  await createPriceListsWorkflow(container).run({
    input: {
      price_lists_data: [
        {
          title: "Eid Offer",
          description: "Launch offer on the Chocolate Heritage panjabi",
          status: "active",
          prices: (chocolate.variants ?? []).map((v) => ({
            variant_id: v.id,
            amount: 1890,
            currency_code: "bdt",
          })),
        },
      ],
    },
  })

  await createPromotionsWorkflow(container).run({
    input: {
      promotionsData: [
        {
          code: "TANTUSH10",
          type: "standard",
          status: "active",
          is_automatic: false,
          application_method: {
            type: "percentage",
            target_type: "order",
            allocation: "across",
            value: 10,
            currency_code: "bdt",
          },
        },
      ],
    },
  })

  logger.info("──────────────────────────────────────────────────────────")
  logger.info("Tantush seed complete.")
  logger.info(`Publishable API key: ${publishableKey.token}`)
  logger.info("Put it in storefront/.env as NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY")
  logger.info("──────────────────────────────────────────────────────────")
}
