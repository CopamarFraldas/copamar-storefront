"use client"

import { useEffect } from "react"

/**
 * OPT-IN pós-compra do Google Customer Reviews (garimpo #7) — prompt OFICIAL
 * do Google na confirmação do pedido perguntando se o cliente quer avaliar a
 * compra. É ESSA coleta que alimenta o seller rating do badge (Merchant Center
 * 122803740) — sem ela, a nota para de ser renovada depois do cutover.
 *
 * DESLIGADO por padrão (NEXT_PUBLIC_GCR_OPTIN !== "true"): em staging os
 * pedidos são de teste e não podem virar convite de avaliação real. Flipar a
 * env no cutover. O prompt é do próprio Google pós-compra (não é tracking
 * nosso) — o gate é só a env.
 *
 * Doc: support.google.com/merchants/answer/7106244
 */
const ATIVO = process.env.NEXT_PUBLIC_GCR_OPTIN === "true"
const MERCHANT_ID = 122803740 // Merchant Center Copamar
const SCRIPT_SRC = "https://apis.google.com/js/platform.js"

/** data do pedido + 7 dias, formato YYYY-MM-DD exigido pelo GCR */
function entregaEstimada(createdAt: string): string {
  const base = new Date(createdAt)
  const d = isNaN(base.getTime()) ? new Date() : base
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

export default function GcrOptin({
  orderId,
  email,
  createdAt,
}: {
  orderId: string
  email: string
  createdAt: string
}) {
  useEffect(() => {
    if (!ATIVO || !orderId || !email) return
    const w = window as any

    const render = () => {
      try {
        w.gapi?.load?.("surveyoptin", () => {
          w.gapi.surveyoptin.render({
            merchant_id: MERCHANT_ID,
            order_id: String(orderId),
            email,
            delivery_country: "BR",
            estimated_delivery_date: entregaEstimada(createdAt),
          })
        })
      } catch {
        /* opt-in indisponível — sem efeito no resto da confirmação */
      }
    }

    // o ?onload= do platform.js chama window.renderOptIn quando carregar —
    // precisa existir ANTES do script (por isso script manual no effect, e
    // não <Script> do Next, que poderia disparar antes do hook)
    w.renderOptIn = render

    if (document.querySelector(`script[src^="${SCRIPT_SRC}"]`)) {
      // já carregado (navegação SPA / outro pedido na mesma sessão):
      // onload não dispara de novo → renderiza direto
      if (w.gapi) render()
      return
    }
    const s = document.createElement("script")
    s.src = `${SCRIPT_SRC}?onload=renderOptIn`
    s.async = true
    s.defer = true
    document.body.appendChild(s)
  }, [orderId, email, createdAt])

  return null
}
