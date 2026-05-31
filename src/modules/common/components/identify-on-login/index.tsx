"use client"

import { useEffect } from "react"

/**
 * Dispara a ponte de identidade (#47) UMA vez por sessão: pega o uuid anônimo do
 * tracking (mesmo localStorage do copamar-track.js) e manda pro /api/track-identify,
 * que — se houver cliente logado — liga uuid↔cliente. Fire-and-forget; o
 * servidor é quem decide (no-op se anônimo). Só com consentimento de analytics.
 */
const UUID_KEY = "copamar_uuid_anon"
const CONSENT_KEY = "copamar_consent_v1"
const FLAG = "copamar_identified_v1"

const IdentifyOnLogin = () => {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(FLAG)) return // 1×/sessão
      // mesma regra do track.js: consentimento de analytics === true
      const c = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null")
      if (!(c && c.analytics === true)) return
      const uuid = localStorage.getItem(UUID_KEY)
      if (!uuid) return
      sessionStorage.setItem(FLAG, "1")
      fetch("/api/track-identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid_anonimo: uuid }),
        keepalive: true,
      }).catch(() => {})
    } catch {
      /* sem storage / sem consentimento → ignora */
    }
  }, [])
  return null
}

export default IdentifyOnLogin
