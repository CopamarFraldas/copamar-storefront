"use client"

import Script from "next/script"
import { useEffect } from "react"

/**
 * Tag do Google Ads (gtag.js, #65) com CONSENT MODE v2 — cutover-crítico:
 * sem ela os anúncios (~R$2k/mês) ficam cegos pra conversão.
 *
 * - Consent default DENIED (ad_storage/ad_user_data/ad_personalization/
 *   analytics_storage) ANTES do gtag carregar — LGPD-first; o Google segue
 *   medindo por modelagem (pings sem cookie).
 * - Quando o cliente decide no banner LGPD (evento copamar-consent-updated,
 *   toggle "marketing"), atualiza pra granted/denied na hora. No boot, lê a
 *   decisão já salva (copamar_consent_v1).
 * - STAGING (NEXT_PUBLIC_GADS_LIVE != "true"): NÃO carrega o gtag.js real —
 *   instala um stub que loga [gads-sim] e empilha em window.__gadsSim, pro
 *   fluxo inteiro ser testável sem poluir os dados do Ads.
 */
const GADS_ID = process.env.NEXT_PUBLIC_GADS_ID || ""
const LIVE = process.env.NEXT_PUBLIC_GADS_LIVE === "true"
const CONSENT_KEY = "copamar_consent_v1"

function aplicaConsentSalvo() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return
    const c = JSON.parse(raw)
    const status = c?.marketing ? "granted" : "denied"
    ;(window as any).gtag?.("consent", "update", {
      ad_storage: status,
      ad_user_data: status,
      ad_personalization: status,
      analytics_storage: c?.analytics ? "granted" : "denied",
    })
  } catch {
    /* sem decisão salva */
  }
}

export default function GoogleAdsTag() {
  useEffect(() => {
    if (!GADS_ID) return
    // decisão já tomada em visita anterior → aplica no boot
    aplicaConsentSalvo()
    // banner LGPD decidiu agora → atualiza na hora
    const onConsent = (ev: Event) => {
      const c = (ev as CustomEvent).detail
      const status = c?.marketing ? "granted" : "denied"
      ;(window as any).gtag?.("consent", "update", {
        ad_storage: status,
        ad_user_data: status,
        ad_personalization: status,
        analytics_storage: c?.analytics ? "granted" : "denied",
      })
    }
    window.addEventListener("copamar-consent-updated", onConsent)
    return () => window.removeEventListener("copamar-consent-updated", onConsent)
  }, [])

  if (!GADS_ID) return null

  return (
    <>
      {/* dataLayer + consent DEFAULT denied — precisa entrar ANTES do gtag.js */}
      <Script id="gads-consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            wait_for_update: 500
          });
          gtag('js', new Date());
          gtag('config', '${GADS_ID}');
          ${
            LIVE
              ? ""
              : `
          // STAGING: stub de simulação — nada sai pro Google
          window.__gadsSim = [];
          window.gtag = function(){
            window.__gadsSim.push(Array.from(arguments));
            try { console.log('[gads-sim]', JSON.stringify(Array.from(arguments))); } catch(e) {}
          };`
          }
        `}
      </Script>
      {LIVE && (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GADS_ID}`}
          strategy="afterInteractive"
        />
      )}
    </>
  )
}
