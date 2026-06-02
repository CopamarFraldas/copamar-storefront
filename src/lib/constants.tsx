import React from "react"
import { CreditCard } from "@medusajs/icons"

import Ideal from "@modules/common/icons/ideal"
import Bancontact from "@modules/common/icons/bancontact"
import PayPal from "@modules/common/icons/paypal"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_stripe_stripe: {
    title: "Cartão de crédito",
    icon: <CreditCard />,
  },
  "pp_medusa-payments_default": {
    title: "Cartão de crédito",
    icon: <CreditCard />,
  },
  "pp_stripe-ideal_stripe": {
    title: "iDeal",
    icon: <Ideal />,
  },
  "pp_stripe-bancontact_stripe": {
    title: "Bancontact",
    icon: <Bancontact />,
  },
  pp_paypal_paypal: {
    title: "PayPal",
    icon: <PayPal />,
  },
  pp_system_default: {
    title: "Pagamento manual",
    icon: <CreditCard />,
  },
  // PagBank (provider custom — PIX ou Cartão de crédito; escolha no painel)
  pp_pagbank_pagbank: {
    title: "PIX ou Cartão (PagBank)",
    icon: <CreditCard />,
  },
  // PagHiper Boleto (#52) — 3ª forma de pagamento (pague em banco/lotérica/app)
  "pp_paghiper-boleto_paghiper-boleto": {
    title: "Boleto bancário",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M4 5v14M7 5v14M10 5v14M14 5v14M17 5v14M20 5v14" />
      </svg>
    ),
  },
  // Add more payment providers here
}

// This only checks if it is native stripe or medusa payments for card payments, it ignores the other stripe-based providers
export const isStripeLike = (providerId?: string) => {
  return (
    providerId?.startsWith("pp_stripe_") || providerId?.startsWith("pp_medusa-")
  )
}

export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}
// PagBank — PIX assíncrono (mostra QR no checkout, confirma via status/webhook)
export const isPagBank = (providerId?: string) => {
  return providerId?.startsWith("pp_pagbank")
}
// PagHiper Boleto (#52) — "pague depois": mostra a linha digitável/PDF no checkout
export const isPagHiperBoleto = (providerId?: string) => {
  return providerId?.startsWith("pp_paghiper-boleto")
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]
