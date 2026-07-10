"use client"

/**
 * Sorteador do A/B do banner do topo (10/07): esteira infinita (A, atual) vs
 * carrossel estático acessível (B). Só entra quando NEXT_PUBLIC_BANNER_AB=on
 * (page.tsx decide server-side; off = BannerEsteira direto, como sempre foi).
 *
 * SSR/hydration: o sorteio mora no localStorage (client-only), então o server
 * e o 1º render do client mostram um PLACEHOLDER com a MESMA altura responsiva
 * das duas variantes (--eh) — a variante entra no useEffect sem layout shift.
 *
 * Medição: banner_view 1x por pageview (com a variante), banner_click nas
 * variantes. Tudo via window.copamarTrack — sem consentimento o pipeline
 * descarta sozinho (LGPD já resolvida lá).
 */

import { useEffect, useRef, useState } from "react"

import BannerEsteira, { type BannerInput, type SlideInput } from "@modules/home/components/banner-esteira"
import BannerCarrossel from "@modules/home/components/banner-carrossel"
import { getBannerVariant, trackBanner, type BannerVariant } from "@lib/tracking/banner-ab"

export default function BannerTopoAB({
  altura = 240,
  alturaMobile,
  duracao = 90,
  prioridade = false,
  banners,
  marcaSlides,
}: {
  altura?: number
  alturaMobile?: number
  /** duração da volta da esteira (só a variante A usa) */
  duracao?: number
  prioridade?: boolean
  banners?: BannerInput[]
  marcaSlides?: SlideInput[]
}) {
  const [variante, setVariante] = useState<BannerVariant | null>(null)
  const viewEnviado = useRef(false)
  const hMobile = alturaMobile ?? altura

  useEffect(() => {
    const v = getBannerVariant()
    setVariante(v)
    if (!viewEnviado.current) {
      viewEnviado.current = true
      trackBanner("banner_view", { variante: v })
    }
  }, [])

  // placeholder estável (server + 1º render do client): mesma altura e mesmo
  // fundo das variantes → sem mismatch de hydration nem pulo de layout
  if (!variante) {
    return (
      <div className="bab-ph w-full bg-copamar-bg-light dark:bg-ui-bg-subtle" aria-hidden="true">
        <style>{`
          .bab-ph { height: ${hMobile}px }
          @media (min-width: 768px) { .bab-ph { height: ${altura}px } }
        `}</style>
      </div>
    )
  }

  return variante === "carrossel" ? (
    <BannerCarrossel altura={altura} alturaMobile={alturaMobile} prioridade={prioridade} banners={banners} />
  ) : (
    <BannerEsteira
      altura={altura}
      alturaMobile={alturaMobile}
      duracao={duracao}
      prioridade={prioridade}
      banners={banners}
      marcaSlides={marcaSlides}
      varianteAB="esteira"
    />
  )
}
