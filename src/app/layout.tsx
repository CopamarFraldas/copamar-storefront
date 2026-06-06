import { getBaseURL } from "@lib/util/env"
import { robotsMeta } from "@lib/util/seo"
import { Metadata } from "next"
import Script from "next/script"
import CookieConsent from "@modules/common/components/cookie-consent"
import GoogleAdsTag from "@modules/common/components/google-ads-tag"
import IdentifyOnLogin from "@modules/common/components/identify-on-login"
import StructuredData from "@modules/common/components/structured-data"
import ThemeProvider from "@modules/common/components/theme-provider"
import WhatsAppFloat from "@modules/layout/components/whatsapp-float"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  // 🚨 noindex/nofollow fora de produção (staging não vaza pro Google). Liga no
  // cutover com NEXT_PUBLIC_ALLOW_INDEXING="true".
  robots: robotsMeta(),
  title: {
    default:
      "Copamar Fraldas — Especialista em Fraldas Geriátricas desde 2006",
    template: "%s | Copamar Fraldas - Especialista em Fraldas Geriátricas desde 2006",
  },
  description:
    "Distribuidora atacadista especializada em fraldas geriátricas. 20 anos de tradição. Parcelamento 3x sem juros, 5% desconto à vista. Entregas para todo o Brasil.",
  keywords: [
    "fralda geriátrica",
    "fralda para idoso",
    "fralda acamado",
    "loja fralda geriátrica",
    "atacado fralda geriátrica",
  ],
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    // expõe o llms.txt como <link rel="alternate" type="text/plain" href="/llms.txt">
    types: { "text/plain": "/llms.txt" },
  },
  openGraph: {
    title: "Copamar Fraldas — Especialista em Fraldas Geriátricas desde 2006",
    description:
      "Distribuidora atacadista especializada em fraldas geriátricas. 20 anos de tradição. Parcelamento 3x sem juros, 5% desconto à vista. Entregas para todo o Brasil.",
    locale: "pt_BR",
    type: "website",
    siteName: "Copamar Fraldas",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Copamar Fraldas — distribuidora atacadista de fraldas geriátricas direto da fábrica",
      },
    ],
  },
}

// Host do R2 (CDN das fotos dos produtos). preconnect/dns-prefetch reduz o tempo
// até a 1ª imagem (LCP em mobile). React 19 hoista <link> pro <head>.
const R2_HOST = "https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev"

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="bg-ui-bg-base text-ui-fg-base">
        <link rel="preconnect" href={R2_HOST} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={R2_HOST} />
        {/* Google Ads gtag + Consent Mode v2 (#65) — todas as páginas */}
        <GoogleAdsTag />
        <ThemeProvider>
          <StructuredData />
          <main className="relative">{props.children}</main>
          <WhatsAppFloat />
          <CookieConsent />
          <IdentifyOnLogin />
          {/* tracking on-site (LGPD): só roda com consentimento; carrega após interativo */}
          <Script src="/copamar-track.js" strategy="afterInteractive" />
        </ThemeProvider>
      </body>
    </html>
  )
}
