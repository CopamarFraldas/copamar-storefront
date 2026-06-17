"use client"

import { useEffect } from "react"

/**
 * Registra o OPT-IN de marketing (#97) no n8n, na confirmação do pedido.
 *
 * - Só dispara se o cliente MARCOU o checkbox no checkout (order.metadata.marketing_consent).
 *   O checkbox nasce DESMARCADO (LGPD) — sem consentimento explícito, não envia nada.
 * - Fire-and-forget (keepalive): não bloqueia nem quebra a confirmação se o n8n falhar.
 * - Idempotente por pedido (localStorage) — não reenvia em re-render/refresh.
 * - Roda na CONFIRMAÇÃO (não no place-order) porque placeOrder() faz redirect
 *   (NEXT_REDIRECT) e mataria qualquer envio posterior.
 */
const ENDPOINT = "https://n8n.copamarfraldas.com.br/webhook/marketing-consent"
const UUID_KEY = "copamar_uuid_anon"

export default function MarketingConsentRegister({
  orderId,
  email,
  nome,
  telefone,
  documento,
  consent,
  ts,
}: {
  orderId: string
  email: string
  nome: string
  telefone: string
  documento: string
  consent: boolean
  ts: string
}) {
  useEffect(() => {
    if (!consent || !orderId || !email) return
    const flag = `copamar_mkt_consent_sent_${orderId}`
    let uuid: string | null = null
    try {
      if (localStorage.getItem(flag)) return
      uuid = localStorage.getItem(UUID_KEY)
    } catch {}

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uuid,
        email,
        nome,
        telefone,
        documento,
        order_id: orderId,
        consent: true,
        origem: "checkout",
        versao: "v1",
        ts,
      }),
      keepalive: true,
      credentials: "omit",
      mode: "cors",
    })
      .then(() => {
        try {
          localStorage.setItem(flag, "1")
        } catch {}
      })
      .catch(() => {})
  }, [orderId, email, nome, telefone, documento, consent, ts])

  return null
}
