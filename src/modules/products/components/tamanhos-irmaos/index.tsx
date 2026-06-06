import { buscarIdsPorFamilia } from "@lib/data/busca"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * "Outros tamanhos" (#4/#1 do bloco) — no catálogo cada tamanho é um PRODUTO
 * separado; aqui religamos os irmãos da mesma família (metadata.familia, gravada
 * pela normalização) e mostramos P·M·G·EG como links, com o atual destacado.
 * A store API não filtra por metadata, então buscamos por texto da família e
 * filtramos pela familia exata.
 */
const ORDEM = ["RN", "P", "P/M", "M", "G", "G/EG", "EG", "XG", "XXG"]

const TamanhosIrmaos = async ({
  product,
  countryCode,
}: {
  product: HttpTypes.StoreProduct
  countryCode: string
}) => {
  const meta = (product.metadata || {}) as any
  const familia: string | undefined = meta.familia
  if (!familia || !meta.tamanho) return null

  // 1º: match EXATO por metadata.familia (06/06 — a busca textual por
  // substring perdia famílias cujo slug pula palavras do título);
  // fallback: busca textual ampla + filtro exato (comportamento antigo)
  const idsFamilia = await buscarIdsPorFamilia(familia, 30)
  const queryParams = idsFamilia?.length
    ? ({ id: idsFamilia, limit: 30, fields: "id,title,handle,+metadata" } as any)
    : ({ q: familia.replace(/-/g, " "), limit: 30, fields: "id,title,handle,+metadata" } as any)
  const { response } = await listProducts({
    countryCode,
    queryParams,
  }).catch(() => ({ response: { products: [] as HttpTypes.StoreProduct[] } }))

  const irmaos = (response.products || [])
    .filter((p) => ((p.metadata || {}) as any).familia === familia)
    .filter((p) => ((p.metadata || {}) as any).tamanho)
    .map((p) => ({
      handle: p.handle,
      tamanho: ((p.metadata || {}) as any).tamanho as string,
      atual: p.id === product.id,
    }))
    // dedup por tamanho (mantém o atual se houver) + ordena
    .reduce((acc, x) => {
      const ex = acc.find((y) => y.tamanho === x.tamanho)
      if (!ex) acc.push(x)
      else if (x.atual) Object.assign(ex, x)
      return acc
    }, [] as { handle?: string; tamanho: string; atual: boolean }[])
    .sort((a, b) => ORDEM.indexOf(a.tamanho) - ORDEM.indexOf(b.tamanho))

  if (irmaos.length < 2) return null

  return (
    <div className="flex flex-col gap-y-2">
      <span className="text-sm font-medium text-ui-fg-base">
        Tamanho disponível:
      </span>
      <div className="flex flex-wrap gap-2">
        {irmaos.map((ir) =>
          ir.atual ? (
            <span
              key={ir.tamanho}
              aria-current="true"
              className="flex h-11 min-w-[3.25rem] items-center justify-center rounded-lg border border-copamar-primary bg-copamar-primary/10 px-3 text-sm font-semibold text-copamar-primary ring-1 ring-copamar-primary"
            >
              {ir.tamanho}
            </span>
          ) : (
            <LocalizedClientLink
              key={ir.tamanho}
              href={`/products/${ir.handle}`}
              className="flex h-11 min-w-[3.25rem] items-center justify-center rounded-lg border border-ui-border-base bg-ui-bg-subtle px-3 text-sm text-ui-fg-base transition hover:border-copamar-primary/60"
            >
              {ir.tamanho}
            </LocalizedClientLink>
          )
        )}
      </div>
    </div>
  )
}

export default TamanhosIrmaos
