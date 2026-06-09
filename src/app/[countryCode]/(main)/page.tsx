import { Metadata } from "next"

import HeroConversao from "@modules/home/components/hero-conversao"
import BussolaSection from "@modules/home/components/hero-bussola/bussola-section"
import FreteCep from "@modules/shipping/components/frete-cep"
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
    "Fraldas geriátricas direto da fábrica, com preço de atacado. Atacadista e distribuidora especializada há 20 anos em Santo André/SP. Fralda para idoso e acamado, parcelamento 3x sem juros, 5% à vista e entrega para todo o Brasil."
  return {
    // absolute: o título já traz a marca; o template do layout anexaria de novo.
    // #56: os termos que o povo realmente busca, no formato aprovado pelo Marco.
    title: {
      absolute: "Fralda Geriátrica Direto das Fábricas · Atacado | Copamar",
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

  return (
    <>
      <HeroConversao />
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
