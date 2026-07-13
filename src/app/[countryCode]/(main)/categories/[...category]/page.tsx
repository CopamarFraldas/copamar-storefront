import { Metadata } from "next"
import { JsonLd, breadcrumbSchema } from "@modules/common/components/structured-data"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import HubFraldasGeriatricas from "@modules/categories/components/hub-fraldas-geriatricas"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getSiteUrl } from "@lib/util/seo"

// HUB do termo-cabeça "fralda geriátrica" (Search Console: pos 7-8, CTR 0,3%;
// a categoria estava na pos 18, canibalizada) — só esta categoria ganha
// metadata dedicada + guia/FAQ/bloco-fábrica; as demais seguem intactas.
const HANDLE_HUB = "fraldas-geriatricas"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export async function generateStaticParams() {
  const product_categories = await listCategories()

  if (!product_categories) {
    return []
  }

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  )

  const categoryHandles = product_categories.map(
    (category: any) => category.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: any) => ({
        countryCode,
        category: [handle],
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    const url = `${getSiteUrl()}/${params.countryCode}/categories/${params.category.join("/")}`

    // metadata dedicada do HUB — definida COMPLETA (gotcha Next: metadata da
    // página SUBSTITUI o do layout, não mescla). Fatos batem com /sobre.
    if (productCategory.handle === HANDLE_HUB) {
      const titleHub =
        "Fralda Geriátrica direto da Fábrica | Copamar — atacado e varejo"
      const descriptionHub =
        "Fralda geriátrica com preço direto de fábrica, no atacado e no varejo. Especialistas desde 2006, 5% de desconto à vista, entrega própria na Grande SP e envio para todo o Brasil."
      return {
        title: { absolute: titleHub },
        description: descriptionHub,
        openGraph: {
          title: titleHub,
          description: descriptionHub,
          type: "website",
          url,
          siteName: "Copamar Fraldas",
          locale: "pt_BR",
          images: [
            {
              url: `${getSiteUrl()}/og-image.png`,
              width: 1200,
              height: 630,
              alt: "Fraldas Geriátricas — Copamar Fraldas",
            },
          ],
        },
        alternates: { canonical: url },
      }
    }

    const description =
      productCategory.description ??
      `${productCategory.name}: fraldas geriátricas e produtos de higiene direto da fábrica, com preço de atacado. Copamar Fraldas, especialista há 20 anos.`

    return {
      // absolute: o template do layout já anexa "| Copamar Fraldas - ...". Sem
      // isso a marca aparecia 3x no <title> da categoria.
      // #56: a loja é atacadista — qualificador natural no title da categoria.
      title: { absolute: `${productCategory.name} no Atacado | Copamar Fraldas` },
      description,
      openGraph: {
        title: `${productCategory.name} no Atacado | Copamar Fraldas`,
        description,
        type: "website",
        url: `${getSiteUrl()}/${params.countryCode}/categories/${params.category.join("/")}`,
        images: [
          {
            url: `${getSiteUrl()}/og-image.png`,
            width: 1200,
            height: 630,
            alt: `${productCategory.name} — Copamar Fraldas`,
          },
        ],
      },
      alternates: {
        // antes era só o handle ("fraldas-geriatricas"), que resolvia pra raiz
        // do domínio. Agora a URL canônica real: /<cc>/categories/<handle>.
        canonical: `${getSiteUrl()}/${params.countryCode}/categories/${params.category.join("/")}`,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const productCategory = await getCategoryByHandle(params.category)

  if (!productCategory) {
    notFound()
  }

  // breadcrumb estruturado (auditoria #54): Início → Loja → categoria
  const { getSiteUrl } = await import("@lib/util/seo")
  const base = `${getSiteUrl()}/${params.countryCode}`
  const ldCrumb = breadcrumbSchema([
    { name: "Início", url: base },
    { name: "Loja", url: `${base}/store` },
    {
      name: productCategory.name,
      url: `${base}/categories/${params.category.join("/")}`,
    },
  ])

  return (
    <>
    <JsonLd data={ldCrumb} />
    <CategoryTemplate
      category={productCategory}
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
    />
    {/* HUB abaixo da grade: guia de escolha + fábrica/atacado + FAQ (JSON-LD) */}
    {productCategory.handle === HANDLE_HUB && <HubFraldasGeriatricas />}
    </>
  )
}
