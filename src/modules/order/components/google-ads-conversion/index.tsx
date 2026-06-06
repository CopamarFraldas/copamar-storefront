"use client"

import { useEffect } from "react"

/**
 * Conversão "COMPRA DO SITE" do Google Ads (#65) — dispara no carregamento da
 * página de confirmação do pedido, com VALOR REAL + transaction_id (o site
 * velho mandava R$1 fixo; valor real deixa o Google otimizar por receita, e o
 * transaction_id deduplica no lado do Ads).
 * Idempotente no cliente: localStorage por pedido — F5/revisita não conta 2x.
 */
const SEND_TO = process.env.NEXT_PUBLIC_GADS_CONV_COMPRA || ""

export default function GoogleAdsConversion({
  value,
  transactionId,
  newCustomer,
}: {
  value: number
  transactionId: string
  newCustomer?: boolean
}) {
  useEffect(() => {
    if (!SEND_TO || !transactionId) return
    const flag = `gads_conv_${transactionId}`
    try {
      if (localStorage.getItem(flag)) return // já disparou (F5/revisita)
    } catch {
      /* localStorage indisponível → dispara mesmo assim (transaction_id
         deduplica no Google) */
    }
    ;(window as any).gtag?.("event", "conversion", {
      send_to: SEND_TO,
      value: Number(value) || 0,
      currency: "BRL",
      transaction_id: String(transactionId),
      ...(newCustomer !== undefined ? { new_customer: newCustomer } : {}),
    })
    try {
      localStorage.setItem(flag, new Date().toISOString())
    } catch {
      /* ok */
    }
  }, [value, transactionId, newCustomer])

  return null
}
