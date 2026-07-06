import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getReviewsAggregates } from "@lib/data/reviews"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"
import RelatedProductsCarousel from "./carousel"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Relacionados por CATEGORIA — nossos produtos Bling não têm collection/tag
  // setados, mas todos têm categoria (Fraldas Geriátricas, Pants, etc) e
  // subcategoria (Tena, Adultcare, ...). Prioridade: pega da subcategoria
  // (mais relevante); se não tiver subcategoria, pega da categoria pai.
  const categoryIds = ((product as any).categories || [])
    .map((c: any) => c.id)
    .filter(Boolean) as string[]

  const queryParams: HttpTypes.StoreProductListParams = { is_giftcard: false }
  if (region?.id) queryParams.region_id = region.id
  if (categoryIds.length) (queryParams as any).category_id = categoryIds

  const products = await listProducts({ queryParams, countryCode })
    .then(({ response }) =>
      response.products.filter((rp) => rp.id !== product.id)
    )
    .catch(() => [])

  if (!products.length) {
    return null
  }

  // estrelinhas dos cards — agregados em LOTE (1 chamada pro trilho todo)
  const reviewsAggs = await getReviewsAggregates(products.map((p) => p.id))

  return (
    <div className="product-page-constraint">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="text-base-regular text-gray-600 mb-6">
          Produtos relacionados
        </span>
        <p className="text-2xl-regular text-ui-fg-base max-w-lg">
          Você também pode gostar destes produtos.
        </p>
      </div>

      {/* Renderiza Product (Server Component async) AQUI e passa como children.
          Client Component (Carousel) não pode renderizar Server Components,
          mas pode recebê-los como children. */}
      <RelatedProductsCarousel>
        {products.map((p) => (
          <Product
            key={p.id}
            region={region}
            product={p}
            reviews={p.id ? reviewsAggs[p.id] : undefined}
          />
        ))}
      </RelatedProductsCarousel>
    </div>
  )
}
