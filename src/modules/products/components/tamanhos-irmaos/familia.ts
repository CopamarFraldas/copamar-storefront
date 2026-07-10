import { buscarIdsPorFamilia } from "@lib/data/busca"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

/**
 * Fonte ÚNICA da descoberta de TAMANHOS IRMÃOS (10/07) — no catálogo cada
 * tamanho é um PRODUTO separado, religado por metadata.familia +
 * metadata.tamanho (gravados pela normalização). Extraída do TamanhosIrmaos
 * da PDP pra ser REUSADA pelo cross-sell do carrinho (cart-button, server):
 * mesmo pipeline (buscarIdsPorFamilia exato → fallback textual → filtro por
 * familia exata → dedup por tamanho → ordena P·M·G).
 *
 * SERVER-ONLY (importa lib/data "use server") — client components recebem o
 * resultado por props, nunca importam este módulo.
 */

export const ORDEM = ["RN", "P", "P/M", "M", "G", "G/EG", "EG", "XG", "XXG"]

/** metadata.tamanho do produto (ou undefined). */
export const tamanhoDe = (p: HttpTypes.StoreProduct): string | undefined =>
  ((p.metadata || {}) as any).tamanho || undefined

export async function buscarIrmaosDaFamilia({
  familia,
  countryCode,
  fields,
  preferId,
}: {
  familia: string
  countryCode: string
  /**
   * fields do listProducts. OMITIR usa o padrão RICO (variants com
   * calculated_price + inventory_quantity) — gotcha conhecido: fields
   * explícito sem esses campos deixa tudo "Esgotado".
   */
  fields?: string
  /** em empate de tamanho, manter este produto (ex.: o da PDP atual) */
  preferId?: string
}): Promise<HttpTypes.StoreProduct[]> {
  // 1º: match EXATO por metadata.familia (06/06 — a busca textual por
  // substring perdia famílias cujo slug pula palavras do título);
  // fallback: busca textual ampla + filtro exato (comportamento antigo)
  const idsFamilia = await buscarIdsPorFamilia(familia, 30).catch(() => null)
  const queryParams: any = idsFamilia?.length
    ? { id: idsFamilia, limit: 30 }
    : { q: familia.replace(/-/g, " "), limit: 30 }
  if (fields) queryParams.fields = fields

  const { response } = await listProducts({
    countryCode,
    queryParams,
  }).catch(() => ({ response: { products: [] as HttpTypes.StoreProduct[] } }))

  return (response.products || [])
    .filter((p) => ((p.metadata || {}) as any).familia === familia)
    .filter((p) => tamanhoDe(p))
    // dedup por tamanho (mantém o preferId se houver) + ordena por ORDEM
    .reduce((acc, p) => {
      const i = acc.findIndex((x) => tamanhoDe(x) === tamanhoDe(p))
      if (i === -1) acc.push(p)
      else if (preferId && p.id === preferId) acc[i] = p
      return acc
    }, [] as HttpTypes.StoreProduct[])
    .sort(
      (a, b) =>
        ORDEM.indexOf(tamanhoDe(a) || "") - ORDEM.indexOf(tamanhoDe(b) || "")
    )
}
