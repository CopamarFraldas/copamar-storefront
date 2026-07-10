import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"
import { COMPLEMENTOS, REGEX_ALVO, REGEX_HIGIENE } from "./curadoria"

/**
 * "Compre Junto" (Manus 10/07, aprovado pelo Marco): complementos de HIGIENE
 * pra completar o cuidado — diferente do "Relacionados" (produtos similares).
 * Curadoria FIXA por tipo (handles publicados, conferidos): zero risco de
 * sugestão sem pé nem cabeça. Fralda/pants → toalha + luva + protetor de cama;
 * absorvente → idem; itens de higiene não mostram a seção (evita circular).
 * A curadoria/regex moram em ./curadoria (compartilhada com a lateral do
 * carrinho — cross-sell do drawer, 10/07).
 */

export default async function CompreJunto({
  product,
  countryCode,
}: {
  product: HttpTypes.StoreProduct
  countryCode: string
}) {
  const titulo = product.title || ""
  // só em fralda/pants/absorvente — e nunca num produto que JÁ é complemento
  if (!REGEX_ALVO.test(titulo) || REGEX_HIGIENE.test(titulo)) {
    return null
  }
  const region = await getRegion(countryCode)
  if (!region) {
    return null
  }

  const products = await listProducts({
    queryParams: {
      handle: COMPLEMENTOS,
      region_id: region.id,
      is_giftcard: false,
    } as HttpTypes.StoreProductListParams,
    countryCode,
  })
    .then(({ response }) =>
      response.products.filter((p) => p.id !== product.id).slice(0, 3)
    )
    .catch(() => [])

  if (products.length < 2) {
    return null
  }

  return (
    <div className="content-container my-10" data-testid="compre-junto">
      <div className="rounded-large border border-ui-border-base bg-copamar-bg-light p-5 small:p-7 dark:bg-ui-bg-subtle">
        <p className="text-lg font-semibold text-ui-fg-base">
          Complete o cuidado 🧺
        </p>
        <p className="mb-5 text-sm text-ui-fg-subtle">
          Quem compra {/fralda|slip/i.test(titulo) ? "fraldas" : "este produto"}{" "}
          costuma levar junto — e chega tudo numa entrega só:
        </p>
        <ul className="grid grid-cols-2 gap-4 small:grid-cols-3">
          {products.map((p) => (
            <li key={p.id}>
              <Product region={region} product={p} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
