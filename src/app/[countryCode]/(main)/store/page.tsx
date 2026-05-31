import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"
import { getSiteUrl } from "@lib/util/seo"

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const { countryCode } = await props.params
  const canonical = `${getSiteUrl()}/${countryCode}/store`
  const description =
    "Catálogo completo de fraldas geriátricas e produtos de higiene — direto da fábrica, preço de atacado. Copamar Fraldas, atacadista especializada há 20 anos. Entrega para todo o Brasil."
  return {
    // absolute: evita o template do layout duplicar "| Copamar Fraldas".
    title: {
      absolute:
        "Fraldas geriátricas — catálogo (atacado e varejo) | Copamar Fraldas",
    },
    description,
    alternates: { canonical },
    openGraph: {
      title: "Loja Copamar Fraldas",
      description,
      type: "website",
      url: canonical,
      // explícito: definir openGraph aqui SUBSTITUI o objeto do layout pai (não
      // mescla) — sem isto a /store ficava sem og:image.
      images: [
        {
          url: `${getSiteUrl()}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "Copamar Fraldas — catálogo de fraldas geriátricas, atacado e varejo",
        },
      ],
    },
  }
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { sortBy, page } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
    />
  )
}
