import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * "Mais procurados" (item 3 da proposta) — atalho de conversão com os modelos
 * PRINCIPAIS, curados a partir do campo `destaque` do catálogo MAPA (Tena
 * Confort/Slip/Pants, Abena Pants Premium, Adultcare, Tena Men/Lady).
 *
 * Rótulo "mais procurados" (não "mais vendidos") DE PROPÓSITO: a fonte é a
 * curadoria de destaque, não dados de venda — sem afirmar número que não temos.
 * Lista estável (sem chamada cross-DB no caminho crítico da home); pra mexer,
 * é só editar HANDLES. Se um handle sumir/ficar indisponível, é pulado.
 */
const HANDLES = [
  "fralda-geriatrica-tena-confort-g-20-unidades",
  "fralda-tena-slip-dermacare-grande-c-32",
  "tena-pants-confort-g-eg-c-32",
  "tena-pants-noturna-g-eg-c-32",
  "roupa-intima-absorvente-abena-pants-m3-premium-15-unidades",
  "fralda-geriatrica-g-adultcare-plus-com-24",
  "tena-pants-men-g-eg-c-16",
  "tena-lady-discreet-normal-com-16-unidades",
]

const FeaturedRail = async ({ region }: { region: HttpTypes.StoreRegion }) => {
  const {
    response: { products },
  } = await listProducts({
    regionId: region.id,
    queryParams: { handle: HANDLES, limit: HANDLES.length } as any,
  })

  if (!products?.length) return null

  // a API não garante a ordem dos handles — reordena na ordem curada.
  const ordenados = HANDLES.map((h) =>
    products.find((p) => p.handle === h)
  ).filter(Boolean) as HttpTypes.StoreProduct[]

  return (
    <section
      id="nossos-produtos"
      aria-labelledby="mais-procurados-h"
      className="content-container py-12 small:py-16"
    >
      <div className="mb-6 flex items-end justify-between small:mb-8">
        <div>
          <h2
            id="mais-procurados-h"
            className="text-2xl font-bold text-copamar-primary dark:text-ui-fg-base small:text-3xl"
          >
            Mais procurados
          </h2>
          <p className="mt-1 text-sm text-ui-fg-subtle">
            Modelos principais de fralda geriátrica e roupa íntima.
          </p>
        </div>
        <LocalizedClientLink
          href="/store"
          className="shrink-0 text-sm font-semibold text-copamar-primary hover:underline"
        >
          Ver tudo →
        </LocalizedClientLink>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 small:grid-cols-4 small:gap-x-6">
        {ordenados.map((product) => (
          <li key={product.id}>
            <ProductPreview product={product} region={region} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default FeaturedRail
