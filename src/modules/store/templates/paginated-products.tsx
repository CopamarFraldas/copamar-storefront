import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { inferGenero, inferMarca, inferTipo } from "@lib/util/product-filters"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
  fields?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  gridId,
  lojaBoost,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  gridId?: string
  lojaBoost?: boolean
}) {
  const queryParams: PaginatedProductsParams = {
    // modo filtro (gridId, ex. categoria/loja): carrega TUDO pra o filtro
    // client-side por data-attribute cobrir o catálogo inteiro (98 produtos).
    limit: gridId ? 100 : 12,
  }

  if (gridId) {
    // fields explícito com +metadata (tamanho) e *categories (gênero) MAS
    // preservando os campos de estoque — senão o card marca "esgotado".
    queryParams["fields"] =
      "*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,+metadata,*categories"
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  let {
    response: { products, count },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
    lojaBoost,
  })

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      <ul
        id={gridId}
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 large:grid-cols-5 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {products.map((p) => {
          return (
            <li
              key={p.id}
              data-titulo={p.title}
              data-tamanho={((p.metadata || {}) as any).tamanho || ""}
              data-marca={inferMarca(p.title || "")}
              data-genero={inferGenero(p.title || "", p.categories)}
              data-tipo={inferTipo(p.title || "", p.categories)}
              data-absorcao={((p.metadata || {}) as any).absorcao_gotas ?? ""}
              data-noturno={((p.metadata || {}) as any).uso_noturno === true || ((p.metadata || {}) as any).uso_noturno === "true" ? "1" : ""}
            >
              <ProductPreview product={p} region={region} />
            </li>
          )
        })}
      </ul>
      {/* no modo filtro carrega tudo (sem paginação); senão pagina normal */}
      {!gridId && totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
