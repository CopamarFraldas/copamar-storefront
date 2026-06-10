"use client"

import { usePathname } from "next/navigation"
import CookieConsent from "@modules/common/components/cookie-consent"
import WhatsAppFloat from "@modules/layout/components/whatsapp-float"

/**
 * "Cromo" global da LOJA (banner de cookies + botão de WhatsApp). Fica fora do
 * app de entregas (/entregas) — lá é um app interno do motorista, sem nada da
 * vitrine (Marco 10/06).
 */
export default function GlobalChrome() {
  const pathname = usePathname()
  if (pathname?.startsWith("/entregas")) return null
  return (
    <>
      <WhatsAppFloat />
      <CookieConsent />
    </>
  )
}
