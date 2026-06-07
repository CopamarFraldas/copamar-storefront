import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import { isProductOutOfStock } from "@lib/util/stock"
import { extrairSpecs } from "@lib/util/specs"
import { getSiteUrl } from "@lib/util/seo"
import {
  JsonLd,
  productSchema,
  breadcrumbSchema,
} from "@modules/common/components/structured-data"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) {
      return []
    }

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })

      return {
        country,
        products: response.products,
      }
    })

    const countryProducts = await Promise.all(promises)

    return countryProducts
      .flatMap((countryData) =>
        countryData.products.map((product) => ({
          countryCode: countryData.country,
          handle: product.handle,
        }))
      )
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
): HttpTypes.StoreProductImage[] {
  const productImages = product.images ?? []

  if (!selectedVariantId || !product.variants) {
    return productImages
  }

  const variant = product.variants.find((v) => v.id === selectedVariantId)
  if (!variant?.images?.length) {
    return productImages
  }

  const imageIdsMap = new Map(variant.images.map((i) => [i.id, true]))
  return productImages.filter((i) => imageIdsMap.has(i.id))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  const { cheapestPrice } = getProductPrice({ product })
  const precoTxt = cheapestPrice?.calculated_price
    ? ` A partir de ${cheapestPrice.calculated_price}.`
    : ""
  const descricao = `Compre ${product.title} na Copamar Fraldas, especialista em fraldas geriátricas desde 2006.${precoTxt} Parcelamento em 3x sem juros, 5% de desconto à vista e entrega para todo o Brasil.`
  const canonical = `${getSiteUrl()}/${params.countryCode}/products/${handle}`

  return {
    // absolute: o título já traz a marca; o template do layout anexaria de novo.
    // #56: qualificador curto só no <title>/OG (o H1 da página segue limpo).
    title: { absolute: `${product.title} — Atacado | Copamar Fraldas` },
    description: descricao,
    alternates: { canonical },
    openGraph: {
      title: `${product.title} — Atacado | Copamar Fraldas`,
      description: descricao,
      type: "website",
      url: canonical,
      images: product.thumbnail
        ? [{ url: product.thumbnail, alt: `${product.title} — Copamar Fraldas` }]
        : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)
  const searchParams = await props.searchParams

  const selectedVariantId = searchParams.v_id

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  }).then(({ response }) => response.products[0])

  if (!pricedProduct) {
    notFound()
  }

  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  // ── JSON-LD Product + Breadcrumb (dados REAIS — sem rating em produto) ──
  const site = getSiteUrl()
  const url = `${site}/${params.countryCode}/products/${pricedProduct.handle}`
  const { cheapestPrice } = getProductPrice({ product: pricedProduct })
  const v0 = pricedProduct.variants?.[0]
  const gtin = (v0 as any)?.barcode || (v0?.sku && /^\d{13}$/.test(v0.sku) ? v0.sku : undefined)
  const esgotado = isProductOutOfStock(pricedProduct)
  const ldProduto = productSchema({
    name: pricedProduct.title,
    description: pricedProduct.description || `${pricedProduct.title} — Copamar Fraldas`,
    // URLs relativas (fotos hospedadas no nosso /public) absolutizadas pro
    // JSON-LD (o Google exige URL completa)
    image: (pricedProduct.images || [])
      .map((i) => i.url)
      .filter(Boolean)
      .map((u) => (String(u).startsWith("http") ? String(u) : `${getSiteUrl()}${u}`)) as string[],
    sku: v0?.sku || undefined,
    gtin,
    brand: pricedProduct.collection?.title || undefined,
    url,
    price: cheapestPrice?.calculated_price_number,
    currency: "BRL",
    availability: esgotado ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    specs: extrairSpecs(pricedProduct),
  })
  // breadcrumb pela CATEGORIA REAL (06/06 — antes era "Loja" genérico):
  // Início → [categoria-pai →] categoria → produto, alinhado à navegação
  const catFolha = (pricedProduct.categories || [])
    .slice()
    .sort((a: any, b: any) => (b.parent_category_id ? 1 : 0) - (a.parent_category_id ? 1 : 0))[0]
  const trilhaCat: { name: string; url: string }[] = []
  if (catFolha) {
    const pai = (catFolha as any).parent_category
    if (pai?.handle) {
      trilhaCat.push({ name: pai.name, url: `${site}/${params.countryCode}/categories/${pai.handle}` })
    }
    trilhaCat.push({ name: catFolha.name, url: `${site}/${params.countryCode}/categories/${catFolha.handle}` })
  } else {
    trilhaCat.push({ name: "Loja", url: `${site}/${params.countryCode}/store` })
  }
  const ldCrumb = breadcrumbSchema([
    { name: "Início", url: site },
    ...trilhaCat,
    { name: pricedProduct.title, url },
  ])

  return (
    <>
      <JsonLd data={[ldProduto, ldCrumb]} />
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
        images={images}
      />
    </>
  )
}
