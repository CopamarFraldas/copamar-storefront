import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
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
    title: {
      absolute:
        "Fralda Geriátrica Direto da Fábrica | Atacadista — Copamar Fraldas",
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

  // Estrutura aprovada (proposta-home.md): hero focado → confiança → mais
  // procurados → categorias → prova social → B2B → FAQ. A barra de aviso (item 0)
  // é site-wide, mora no Nav.
  return (
    <>
      <Hero />
      <TrustStrip />
      <FeaturedRail region={region} />
      <CategoriesSection />
      <SocialProof />
      <B2bStrip />
      <HomeFaq />
    </>
  )
}
