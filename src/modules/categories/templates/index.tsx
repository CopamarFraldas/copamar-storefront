import { notFound } from "next/navigation"
import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import SubcategoriasBand from "@modules/categories/components/subcategorias-band"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import FiltrosBusca from "@modules/store/components/filtros-busca"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

export default function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      parents.push(category.parent_category)
      getParents(category.parent_category)
    }
  }

  getParents(category)

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList sortBy={sort} data-testid="sort-by-container" />
      <div className="w-full">
        <div className="flex flex-row mb-8 text-2xl-semi gap-4">
          {parents &&
            parents.map((parent) => (
              <span key={parent.id} className="text-ui-fg-subtle">
                <LocalizedClientLink
                  className="mr-4 hover:text-ui-fg-base"
                  href={`/categories/${parent.handle}`}
                  data-testid="sort-by-link"
                >
                  {parent.name}
                </LocalizedClientLink>
                /
              </span>
            ))}
          {/* #56: a categoria-pilar ganha o qualificador de atacado no H1
              (slot mais valioso da landing); as demais ficam com o nome puro */}
          <h1 data-testid="category-page-title">
            {category.handle === "fraldas-geriatricas"
              ? "Fraldas Geriátricas no Atacado"
              : category.name}
          </h1>
        </div>
        {category.handle === "fraldas-geriatricas" && (
          <p className="-mt-6 mb-8 text-sm text-ui-fg-subtle">
            Direto das fábricas das principais marcas, com preço de atacado e
            entrega para todo o Brasil.
          </p>
        )}
        {category.description && (
          <div className="mb-8 text-base-regular">
            <p>{category.description}</p>
          </div>
        )}
        {/* faixa de subcategorias (aprovado 10/07): botões grandes touch-first
            no topo da listagem — substitui os chips pequenos "Refine sua busca".
            Sem filhas, o componente não renderiza nada. */}
        <SubcategoriasBand
          categoriaNome={category.name}
          subs={category.category_children}
        />

        {/* filtros rápidos (nº5) — tamanho 100% (metadata) + tipo/absorção */}
        <FiltrosBusca gridId="categoria-grid" />
        <Suspense
          fallback={
            <SkeletonProductGrid
              numberOfProducts={category.products?.length ?? 8}
            />
          }
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            categoryId={category.id}
            countryCode={countryCode}
            gridId="categoria-grid"
          />
        </Suspense>
      </div>
    </div>
  )
}
