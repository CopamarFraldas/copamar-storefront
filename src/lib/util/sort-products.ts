import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { grupoLoja } from "./product-filters"

interface MinPricedProduct extends HttpTypes.StoreProduct {
  _minPrice?: number
}

/**
 * Helper function to sort products by price until the store API supports sorting by price
 * @param products
 * @param sortBy
 * @param lojaBoost — só a /store: Tena primeiro, infantil por último (Marco
 *   11/06; o rank 1-6 das Enzzo Baby jogava as INFANTIS pro topo da loja).
 *   Não se aplica quando o cliente escolhe ordenar por preço (intenção explícita).
 * @returns products sorted
 */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions,
  lojaBoost = false
): HttpTypes.StoreProduct[] {
  let sortedProducts = products as MinPricedProduct[]

  if (["price_asc", "price_desc"].includes(sortBy)) {
    // Precompute the minimum price for each product
    sortedProducts.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        product._minPrice = Math.min(
          ...product.variants.map(
            (variant) => variant?.calculated_price?.calculated_amount || 0
          )
        )
      } else {
        product._minPrice = Infinity
      }
    })

    // Sort products based on the precomputed minimum prices
    sortedProducts.sort((a, b) => {
      const diff = a._minPrice! - b._minPrice!
      return sortBy === "price_asc" ? diff : -diff
    })
  }

  // "destaque" (Mais vendidos, default da loja) usa a recência como base e
  // aplica os boosts abaixo por cima — sem nenhum metadata.destaque no
  // catálogo, a ordem fica IDÊNTICA à antiga "created_at" com boost.
  if (sortBy === "created_at" || sortBy === "destaque") {
    sortedProducts.sort((a, b) => {
      return (
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )
    })
  }

  // Rank manual (metadata.rank) tem prioridade: produtos com rank aparecem
  // primeiro, em ordem crescente; os demais mantêm a ordenação acima (sort
  // estável). Usado p/ fixar a ordem das fraldas: RN→P→M→G→XG→XXG.
  sortedProducts.sort((a, b) => {
    const ra = Number((a.metadata as any)?.rank ?? Infinity)
    const rb = Number((b.metadata as any)?.rank ?? Infinity)
    return ra - rb
  })

  // "Mais vendidos": metadata.destaque MAIOR primeiro (mesma curadoria do
  // campo destaque do catálogo MAPA; true conta como 1). Sem destaque = 0,
  // então quem não tem mantém a ordenação acima (sort estável).
  if (sortBy === "destaque") {
    sortedProducts.sort((a, b) => {
      const da = Number((a.metadata as any)?.destaque) || 0
      const db = Number((b.metadata as any)?.destaque) || 0
      return db - da
    })
  }

  // Boost da LOJA (estável, por último = vence): Tena (0) → demais (1) →
  // infantil (2). Dentro de cada grupo a ordenação acima se mantém — as Enzzo
  // Baby seguem RN→P→M→G entre si, mas no FIM da vitrine. O destaque ordena
  // DENTRO de cada grupo (não fura a regra do Marco 11/06).
  if (lojaBoost && (sortBy === "created_at" || sortBy === "destaque")) {
    sortedProducts.sort(
      (a, b) => grupoLoja(a.title || "", a.categories) - grupoLoja(b.title || "", b.categories)
    )
  }

  return sortedProducts
}
