"use client"

import { useI18n } from "@lib/i18n/context"
import React from "react"


import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

function AccountHelp() {
  const { t } = useI18n()
  const phone = process.env.NEXT_PUBLIC_SHOP_PHONE
  return (
    <div className="flex flex-col small:flex-row small:items-end justify-between small:border-t border-espresso/10 py-12 gap-4">
      <div>
        <h3 className="font-display text-2xl text-espresso mb-2">{t.order.help}</h3>
        <span className="text-sm text-espresso/70">{t.order.helpBody}</span>
      </div>
      {phone && (
        <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="link-underline text-espresso">
          {phone}
        </a>
      )}
    </div>
  )
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="flex-1 small:py-12" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-5xl mx-auto bg-white flex flex-col">
        <div className="grid grid-cols-1  small:grid-cols-[240px_1fr] py-12">
          <div>{customer && <AccountNav customer={customer} />}</div>
          <div className="flex-1">{children}</div>
        </div>
        <AccountHelp />
      </div>
    </div>
  )
}

export default AccountLayout
