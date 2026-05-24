import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import Script from "next/script"
import CookieConsent from "@modules/common/components/cookie-consent"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Copamar Fraldas — Cuidado e dignidade pra quem você ama",
    template: "%s | Copamar Fraldas",
  },
  description:
    "Fraldas geriátricas, fraldas infantis e produtos de higiene pra cuidadores. Entrega para todo o Brasil. Atendimento especializado.",
  openGraph: {
    title: "Copamar Fraldas — Cuidado e dignidade pra quem você ama",
    description:
      "Fraldas geriátricas, fraldas infantis e produtos de higiene pra cuidadores. Entrega para todo o Brasil.",
    locale: "pt_BR",
    type: "website",
    siteName: "Copamar Fraldas",
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-mode="light">
      <body>
        <main className="relative">{props.children}</main>
        <CookieConsent />
        {/* tracking on-site (LGPD): só roda com consentimento; carrega após interativo */}
        <Script src="/copamar-track.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
