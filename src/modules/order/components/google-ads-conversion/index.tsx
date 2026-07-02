"use client"

import { useEffect } from "react"

/**
 * Conversão "COMPRA DO SITE" do Google Ads (#65) + Enhanced Conversions
 * CONSENT-AWARE (01/07).
 *
 * - SEMPRE dispara a conversão (valor real + transaction_id). O Consent Mode é
 *   Avançado, então o ping vai pro Google mesmo com consentimento negado
 *   (modelagem).
 * - Enhanced Conversions (e-mail/telefone hasheados SHA-256, spec do Google) SÓ
 *   quando o marketing (ad_user_data) está GRANTED — é dado PRIMÁRIO do checkout
 *   e restaura a atribuição direta que o Consent Mode negado derruba. Pra quem
 *   NEGOU: NÃO manda PII (LGPD / desvio de finalidade + é o comportamento padrão
 *   do EC + Consent Mode do Google) — a modelagem cobre.
 * - Idempotente por pedido (localStorage): F5/revisita não conta 2x.
 * - Hash client-side (crypto.subtle): a PII em claro nunca sai da página.
 */
const SEND_TO = process.env.NEXT_PUBLIC_GADS_CONV_COMPRA || ""
const CONSENT_KEY = "copamar_consent_v1"

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// e-mail: trim + lowercase (spec Google)
function normEmail(e?: string): string {
  return String(e || "").trim().toLowerCase()
}
// telefone: E.164 (spec Google). BR: garante o DDI 55.
function normPhone(p?: string): string {
  const d = String(p || "").replace(/\D/g, "")
  if (!d) return ""
  if (d.startsWith("55") && d.length >= 12) return "+" + d
  if (d.length === 10 || d.length === 11) return "+55" + d
  return "+" + d
}

// consentimento de marketing (= ad_user_data granted) — mesma fonte do GoogleAdsTag
function marketingConcedido(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    return !!(raw && JSON.parse(raw)?.marketing)
  } catch {
    return false
  }
}

export default function GoogleAdsConversion({
  value,
  transactionId,
  email,
  phone,
  newCustomer,
}: {
  value: number
  transactionId: string
  email?: string
  phone?: string
  newCustomer?: boolean
}) {
  useEffect(() => {
    if (!SEND_TO || !transactionId) return
    const flag = `gads_conv_${transactionId}`
    try {
      if (localStorage.getItem(flag)) return // já disparou (F5/revisita)
    } catch {
      /* localStorage indisponível → dispara mesmo assim (transaction_id deduplica) */
    }

    const disparar = async () => {
      const g = (window as any).gtag
      if (!g) return

      // Enhanced Conversions — SÓ com consentimento de marketing (LGPD + spec Google)
      if (marketingConcedido()) {
        try {
          const ud: Record<string, string> = {}
          const e = normEmail(email)
          if (e) ud.sha256_email_address = await sha256Hex(e)
          const ph = normPhone(phone)
          if (ph) ud.sha256_phone_number = await sha256Hex(ph)
          if (Object.keys(ud).length) g("set", "user_data", ud)
        } catch {
          /* falha no hash/crypto → segue sem EC (a conversão ainda dispara) */
        }
      }

      g("event", "conversion", {
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
    }
    disparar()
  }, [value, transactionId, email, phone, newCustomer])

  return null
}
