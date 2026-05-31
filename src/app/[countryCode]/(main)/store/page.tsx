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
    title: "Fraldas geriátricas — catálogo (atacado e varejo) | Copamar Fraldas",
    description,
    alternates: { canonical },
    openGraph: { title: "Loja Copamar Fraldas", description, type: "website", url: canonical },
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
