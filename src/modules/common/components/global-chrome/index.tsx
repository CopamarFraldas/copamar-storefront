"use client"

import { usePathname } from "next/navigation"
import CookieConsent from "@modules/common/components/cookie-consent"
import WhatsAppFloat from "@modules/layout/components/whatsapp-float"
import MapaChatStatusBridge from "@modules/layout/components/mapa-chat/status"

/**
 * "Cromo" global da LOJA (banner de cookies + botão de WhatsApp). Fica fora do
 * app de entregas (/entregas) — lá é um app interno do motorista, sem nada da
 * vitrine (Marco 10/06).
 *
 * MapaChatStatusBridge: checa o failover do chat da MAPA e seta
 * html.mapa-chat-ativo — mora AQUI (e não no widget, que é só da vitrine)
 * pra esconder o FAB verde do WhatsApp também no checkout durante a
 * restrição da Meta.
 */
export default function GlobalChrome() {
  const pathname = usePathname()
  if (pathname?.startsWith("/entregas")) return null
  return (
    <>
      <MapaChatStatusBridge />
      <WhatsAppFloat />
      <CookieConsent />
    </>
  )
}
