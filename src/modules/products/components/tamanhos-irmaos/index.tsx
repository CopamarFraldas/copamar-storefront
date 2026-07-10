import { buscarIdsPorFamilia } from "@lib/data/busca"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import GuiaMedidas from "@modules/products/components/guia-medidas"
import { extrairMedidaCintura } from "@modules/products/components/guia-medidas/extrair"

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
  // description entra nos fields pro guia de medidas extrair a faixa de
  // cintura/quadril REAL de cada tamanho da família (Pacote G)
  const idsFamilia = await buscarIdsPorFamilia(familia, 30)
  const queryParams = idsFamilia?.length
    ? ({ id: idsFamilia, limit: 30, fields: "id,title,handle,description,+metadata" } as any)
    : ({ q: familia.replace(/-/g, " "), limit: 30, fields: "id,title,handle,description,+metadata" } as any)
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
      // faixa de cintura/quadril extraída da descrição (guia de medidas)
      medida: extrairMedidaCintura(p.description),
    }))
    // dedup por tamanho (mantém o atual se houver) + ordena
    .reduce((acc, x) => {
      const ex = acc.find((y) => y.tamanho === x.tamanho)
      if (!ex) acc.push(x)
      else if (x.atual) Object.assign(ex, x)
      return acc
    }, [] as { handle?: string; tamanho: string; atual: boolean; medida: string | null }[])
    .sort((a, b) => ORDEM.indexOf(a.tamanho) - ORDEM.indexOf(b.tamanho))

  if (irmaos.length < 2) return null

  // linhas do guia de medidas: todos os tamanhos da família, com a faixa
  // real quando a descrição marca (senão "veja na descrição" na tabela)
  const linhasMedidas = irmaos.map((ir) => ({
    tamanho: ir.tamanho,
    medida: ir.medida,
    atual: ir.atual,
  }))
  const temMedidasReais = linhasMedidas.some((l) => l.medida)
  // o guia só entra onde medir cintura/quadril faz sentido: com medida real
  // na família OU produto adulto (geriátrica/pants). Infantil vai por peso e
  // luvas/protetores nem têm cintura — tabela geral lá seria informação errada.
  const publicoAdulto = (product.categories || []).some((c) =>
    /geri[áa]tric|pants|roupa\s*[íi]ntima|plena/i.test(c.name || "")
  )
  const mostrarGuia = temMedidasReais || publicoAdulto

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
      {/* guia de medidas (Pacote G) — a dúvida nº1 de quem compra fralda;
          modal com a tabela de cintura/quadril da própria família */}
      {mostrarGuia && (
        <GuiaMedidas linhas={temMedidasReais ? linhasMedidas : undefined} />
      )}
    </div>
  )
}

export default TamanhosIrmaos
