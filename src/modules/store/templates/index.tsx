import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import FiltrosLoja from "@modules/store/components/filtros-loja"
import SortDropdown from "@modules/store/components/sort-dropdown"
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
  // default = "Mais vendidos" (destaque): curadoria via metadata.destaque com
  // recência de base — sem destaque no catálogo, a vitrine fica igual à antiga.
  const sort = sortBy || "destaque"

  return (
    <div className="py-6 content-container" data-testid="category-container">
      {/* título + ORDENAR no mesmo bloco (Marco 16/06: o sort ficava largado num
          vão vazio; agora é um dropdown compacto ao lado do título) */}
      <div className="mb-5 flex flex-col gap-3 small:flex-row small:items-end small:justify-between">
        <div>
          {/* #56: H1 com as keywords reais (era "Todos os produtos", genérico) */}
          <h1 className="text-2xl-semi" data-testid="store-page-title">
            Fraldas Geriátricas no Atacado — Catálogo Completo
          </h1>
          <p className="mt-1 text-sm text-ui-fg-subtle">
            Direto das fábricas, com preço de atacado. Entrega para todo o Brasil.
          </p>
        </div>
        <div className="shrink-0">
          <SortDropdown sortBy={sort} />
        </div>
      </div>

      {/* Filtros = GAVETA deslizante (aba na borda esquerda, desktop e mobile —
          Marco 16/06); o grid usa a LARGURA INTEIRA. */}
      <FiltrosLoja gridId="store-grid" />

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
  )
}

export default StoreTemplate
