import type { Metadata, Viewport } from "next"

/**
 * App de ENTREGAS (motorista) — área isolada da loja (Marco 10/06). Sem header
 * da loja, mobile-first, PWA. Nunca indexável. O middleware exclui /entregas
 * (rota sem countryCode). Paleta própria (app interno, sempre "light").
 */
export const metadata: Metadata = {
  title: "Rota Copamar",
  description: "App de entregas da frota Copamar",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1251b8",
}

export default function EntregasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#0f172a] antialiased">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  )
}
