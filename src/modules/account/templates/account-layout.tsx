import React from "react"

import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@medusajs/ui"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="flex-1 small:py-12" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-5xl mx-auto bg-ui-bg-base flex flex-col">
        <div className="grid grid-cols-1  small:grid-cols-[240px_1fr] py-12">
          <div>{customer && <AccountNav customer={customer} />}</div>
          <div className="flex-1">{children}</div>
        </div>
        <div className="flex flex-col small:flex-row items-end justify-between small:border-t border-gray-200 py-12 gap-8">
          <div>
            <h3 className="text-xl-semi mb-4">Tem dúvidas?</h3>
            <span className="txt-medium">
              Nossa equipe está pronta pra te ajudar de segunda a sexta, das
              8h às 17h. Chama no WhatsApp ou manda um e-mail.
            </span>
          </div>
          <div>
            <a
              className="flex gap-x-1 items-center group"
              href="https://wa.me/5511952050000"
              target="_blank"
              rel="noreferrer"
            >
              <Text className="text-ui-fg-interactive">Falar no WhatsApp</Text>
              <ArrowUpRightMini
                className="group-hover:rotate-45 ease-in-out duration-150"
                color="var(--fg-interactive)"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
