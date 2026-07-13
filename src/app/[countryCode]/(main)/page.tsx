import { Metadata } from "next"
import { Suspense } from "react"

import AvisoRecompraInvalida from "@modules/home/components/aviso-recompra-invalida"
import HeroConversao, { getBanners } from "@modules/home/components/hero-conversao"
import BannerEsteira from "@modules/home/components/banner-esteira"
import BannerTopoAB from "@modules/home/components/banner-topo-ab"
// 04/07 (2º passe LCP/TBT): BussolaSection e FreteCep entram por wrappers
// dynamic({ssr:false}) — ver comentários nos wrappers. BussolaSection tira
// framer-motion do bundle inicial; FreteCep tira o JS da calculadora. Ambos
// abaixo da dobra, sem valor de SEO. page.tsx é Server Component, por isso os
// dynamic({ssr:false}) moram nos wrappers "use client", não aqui.
import BussolaSection from "@modules/home/components/hero-bussola/bussola-section-lazy"
import FreteCep from "@modules/shipping/components/frete-cep/frete-cep-lazy"
import GuiaEscolha from "@modules/home/components/guia-escolha"
import TrustStrip from "@modules/home/components/trust-strip"
import FeaturedRail from "@modules/home/components/featured-rail"
import CategoriesSection from "@modules/home/components/categories-section"
import SocialProof from "@modules/home/components/social-proof"
import B2bStrip from "@modules/home/components/b2b-strip"
import HomeFaq from "@modules/home/components/home-faq"
import { getRegion } from "@lib/data/regions"

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const { getSiteUrl } = await import("@lib/util/seo")
  const description =
    "Fraldas geriátricas direto da fábrica, no atacado e varejo desde 2006. Entrega própria em SP e ABC, envio para todo o Brasil e 5% à vista no PIX."
  return {
    // absolute: o título já traz a marca; o template do layout anexaria de novo.
    // SEO 12/07 (Search Console 28d): a home canibalizava a categoria no head
    // term "fralda geriátrica" (categoria em pos 18) — o head term agora é da
    // /categories/fraldas-geriatricas; a home foca marca + diferenciais que JÁ
    // ganham ("direto da fábrica" pos 5,1 / "atacado" pos 3,4).
    title: {
      absolute: "Copamar Fraldas — Fábrica de Fraldas Geriátricas | Atacado",
    },
    description,
    alternates: { canonical: `${getSiteUrl()}/${countryCode}` },
    keywords: [
      "fralda geriátrica",
      "fralda geriátrica direto da fábrica",
      "fábrica de fraldas",
      "fralda geriátrica atacado",
      "atacadista de fraldas",
      "fralda para idoso",
      "fralda para acamado",
    ],
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const region = await getRegion(countryCode)
  if (!region) return null

  // Ordem otimizada pra mobile (painel de design): hero enxuto → MAIS PROCURADOS
  // (produto sobe, logo após o hero) → confiança → categorias → prova social →
  // B2B → FAQ. Busca, barra de aviso e a régua de categorias são site-wide
  // (moram no Nav/header agora).
  // Opção C (painel multi-agente 08/06): hero "cartão de visitas" (Hero,
  // server-rendered) + a Bússola atrás de um botão chamativo "Me ajude a
  // escolher" (BussolaSection). Flag NEXT_PUBLIC_HERO_BUSSOLA controla a
  // entrada da Bússola; o cartão é sempre o herói.
  const heroBussola = process.env.NEXT_PUBLIC_HERO_BUSSOLA === "true"
  // Banner no TOPO (irmão do Marco, 10/07): padrão Amazon/ML — promo antes do hero.
  // Mobile mais baixo (140px) pra não engolir a 1ª dobra; 1ª imagem com priority (LCP).
  const bannerTopo = process.env.NEXT_PUBLIC_BANNER_TOPO === "true"
  const bannersTopo = bannerTopo ? await getBanners() : null
  // A/B esteira×carrossel no banner do topo (10/07, ressalva WCAG 2.2.2 da
  // super análise). "on" = sorteio 50/50 client-side (banner-topo-ab);
  // qualquer outro valor = kill switch, todo mundo vê a esteira atual.
  const bannerAB = process.env.NEXT_PUBLIC_BANNER_AB === "on"

  return (
    <>
      {/* aviso discreto de link de recompra inválido (?recompra=invalido) —
          client-side + Suspense pra não tirar a home do cache estático */}
      <Suspense fallback={null}>
        <AvisoRecompraInvalida />
      </Suspense>
      {bannerTopo &&
        (bannerAB ? (
          <BannerTopoAB altura={200} alturaMobile={140} duracao={90} prioridade
            banners={bannersTopo?.banners} marcaSlides={bannersTopo?.marca_slides} />
        ) : (
          <BannerEsteira altura={200} alturaMobile={140} duracao={90} prioridade
            banners={bannersTopo?.banners} marcaSlides={bannersTopo?.marca_slides} />
        ))}
      <HeroConversao esteira={!bannerTopo} />
      {heroBussola && <BussolaSection />}
      {/* dois "ajudantes" cedo na página: consultor de frete (nº1) + guia de
          escolha (nº3). Lado a lado no desktop (aproveita a largura, mais
          parecido com o conceito mobile); empilhados no mobile. */}
      <div className="content-container py-5">
        {/* mesma largura do Hero acima (content-container cheio, sem max-w-5xl)
            e altura equiparada via items-stretch + h-full nos dois blocos */}
        <div className="grid items-stretch gap-4 small:grid-cols-2">
          <FreteCep compact />
          <GuiaEscolha />
        </div>
      </div>
      <FeaturedRail region={region} />
      <TrustStrip />
      <CategoriesSection />
      <SocialProof />
      <B2bStrip />
      <HomeFaq />
    </>
  )
}
