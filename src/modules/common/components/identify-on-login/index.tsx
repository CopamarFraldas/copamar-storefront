"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * Ponte de identidade (#47): pega o uuid anônimo do tracking (mesmo localStorage
 * do copamar-track.js) e manda pro /api/track-identify, que — se houver cliente
 * logado — liga uuid↔cliente. Só com consentimento de analytics.
 *
 * Re-tenta a cada navegação ATÉ ter sucesso (flag só é setado no ok=true). Isso
 * cobre o caso real: a 1ª carga costuma ser ANÔNIMA (antes do login) → no-op; ao
 * logar (mesmo via soft-nav), o pathname muda e a gente tenta de novo, agora
 * autenticado → liga e para. (Antes o flag era setado na 1ª tentativa anônima e
 * nunca mais disparava — bug do feed mostrar "não identificado".)
 */
const UUID_KEY = "copamar_uuid_anon"
const CONSENT_KEY = "copamar_consent_v1"
const FLAG = "copamar_identified_v1"

const IdentifyOnLogin = () => {
  const pathname = usePathname()
  useEffect(() => {
    try {
      if (sessionStorage.getItem(FLAG)) return // já ligado nesta sessão
      const c = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null")
      if (!(c && c.analytics === true)) return // respeita LGPD (igual track.js)
      const uuid = localStorage.getItem(UUID_KEY)
      if (!uuid) return
      fetch("/api/track-identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid_anonimo: uuid }),
      })
        .then((r) => r.json())
        .then((j) => {
          // só marca como feito quando REALMENTE ligou (cliente logado)
          if (j?.ok) sessionStorage.setItem(FLAG, "1")
        })
        .catch(() => {})
    } catch {
      /* sem storage / sem consentimento → ignora */
    }
  }, [pathname])
  return null
}

export default IdentifyOnLogin
