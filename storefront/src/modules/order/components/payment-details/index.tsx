import { Heading, Text } from "@medusajs/ui"

import { getDictionary } from "@lib/i18n/server"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Divider from "@modules/common/components/divider"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

export default async function PaymentDetails({ order }: PaymentDetailsProps) {
  const { t } = await getDictionary()
  return (
    <div>
      <Heading level="h2" className="flex flex-row text-3xl-regular my-6">
        {t.checkout.payment}
      </Heading>
      <div className="flex items-start gap-x-1 w-full">
        <div className="flex flex-col w-1/2">
          <Text className="txt-medium-plus text-ui-fg-base mb-1">{t.checkout.paymentMethod}</Text>
          <Text className="txt-medium text-ui-fg-subtle" data-testid="payment-method">
            {t.checkout.cod}
          </Text>
        </div>
        <div className="flex flex-col w-1/2">
          <Text className="txt-medium-plus text-ui-fg-base mb-1">{t.cart.total}</Text>
          <Text className="txt-medium text-ui-fg-subtle" data-testid="payment-amount">
            {convertToLocale({ amount: order.total, currency_code: order.currency_code })}
          </Text>
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}
