import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import FiltrosLoja from "@modules/store/components/filtros-loja"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      {/* sidebar: ordenar + FILTROS multi-seleção (marca/tamanho/gênero) —
          só na loja (Marco 11/06); categorias seguem com o filtro próprio.
          max-h + overflow próprio: a sidebar é mais alta que a viewport, e sem
          isso o sticky deixava as opções de baixo inalcançáveis (scroll com o
          mouse sobre ela rola a PRÓPRIA sidebar agora). */}
      <div className="small:sticky small:top-20 small:max-w-[280px] small:max-h-[calc(100vh-13rem)] small:overflow-y-auto small:overscroll-contain small:pr-1">
        <RefinementList sortBy={sort} />
        <div className="px-6 pb-8 small:px-0 small:ml-[1.675rem]">
          <FiltrosLoja gridId="store-grid" />
        </div>
      </div>
      <div className="w-full">
        <div className="mb-8">
          {/* #56: H1 com as keywords reais (era "Todos os produtos", genérico) */}
          <h1 className="text-2xl-semi" data-testid="store-page-title">
            Fraldas Geriátricas no Atacado — Catálogo Completo
          </h1>
          <p className="mt-1 text-sm text-ui-fg-subtle">
            Direto das fábricas, com preço de atacado. Entrega para todo o Brasil.
          </p>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
            gridId="store-grid"
            lojaBoost
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
