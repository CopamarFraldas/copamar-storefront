import { Metadata } from "next"
import { buscarIdsProdutos } from "@lib/data/busca"

import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import FiltrosBusca from "@modules/store/components/filtros-busca"
import { getSiteUrl, robotsMeta } from "@lib/util/seo"

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { countryCode } = await params
  const { q } = await searchParams
  const termo = (q || "").trim()
  return {
    title: termo
      ? `Busca: ${termo} | Copamar Fraldas`
      : "Buscar produtos | Copamar Fraldas",
    // páginas de busca não são indexáveis (parametrizadas) — e em staging tudo
    // é noindex de qualquer forma.
    robots: { index: false, follow: true },
    alternates: { canonical: `${getSiteUrl()}/${countryCode}/search` },
  }
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { countryCode } = await params
  const { q } = await searchParams
  const termo = (q || "").trim()

  const region = await getRegion(countryCode)
  if (!region) return null

  // busca ACENTO-INSENSÍVEL (unaccent no backend); fallback = ?q nativo.
  const idsBusca = termo ? await buscarIdsProdutos(termo, 48) : null
  const {
    response: { products, count },
  } = termo
    ? idsBusca && idsBusca.ids.length === 0
      ? { response: { products: [], count: 0 } }
      : await listProducts({
          countryCode,
          // limit alto + metadata (filtro de tamanho) + inventory (senão o card
          // marca "esgotado" por falta do campo). NÃO remover os campos de estoque.
          queryParams: {
            ...(idsBusca ? { id: idsBusca.ids } : { q: termo }),
            limit: 48,
            fields:
              "*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,+metadata",
          } as any,
        })
    : { response: { products: [], count: 0 } }

  return (
    <div className="content-container py-8">
      <h1 className="text-2xl font-semibold text-ui-fg-base break-words">
        {termo ? (
          <>
            Resultados para{" "}
            <span className="text-copamar-primary">“{termo}”</span>
          </>
        ) : (
          "Buscar produtos"
        )}
      </h1>
      {termo && (
        <p className="mt-1 text-sm text-ui-fg-subtle">
          {count} {count === 1 ? "produto encontrado" : "produtos encontrados"}
        </p>
      )}

      {/* filtros rápidos (nº5) — tamanho 100% (metadata) + tipo/absorção/gênero */}
      {termo && products.length > 0 && (
        <div className="mt-4">
          <FiltrosBusca gridId="busca-grid" />
        </div>
      )}

      {termo && products.length === 0 ? (
        <div className="mt-10 rounded-large border border-ui-border-base bg-ui-bg-subtle p-8 text-center">
          <p className="text-ui-fg-base">
            Nenhum produto encontrado para <strong>“{termo}”</strong>.
          </p>
          <p className="mt-2 text-sm text-ui-fg-subtle">
            Tente outro termo (ex.: a marca, o modelo ou o tamanho) ou veja todo o
            catálogo.
          </p>
          <LocalizedClientLink
            href="/store"
            className="mt-4 inline-block rounded-large bg-copamar-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-copamar-primary-dark"
          >
            Ver todos os produtos
          </LocalizedClientLink>
        </div>
      ) : (
        <ul
          id="busca-grid"
          className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 small:grid-cols-3 small:gap-x-6 medium:grid-cols-4"
        >
          {products.map((p) => (
            <li
              key={p.id}
              data-titulo={p.title}
              data-tamanho={((p.metadata || {}) as any).tamanho || ""}
            >
              <ProductPreview product={p} region={region} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
