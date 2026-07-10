import { retrieveCart } from "@lib/data/cart"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import {
  COMPLEMENTOS_DRAWER,
  REGEX_ALVO,
  REGEX_HIGIENE,
} from "@modules/products/components/compre-junto/curadoria"
import CartDrawer from "../cart-drawer"

export default async function CartButton() {
  const cart = await retrieveCart().catch(() => null)
  const countryCode = cart?.shipping_address?.country_code || "br"

  // Cross-sell da lateral (Marco 10/07): a curadoria toalha/luva é buscada
  // AQUI (server, listProducts cacheado por tag) e vai pronta por props —
  // abrir o drawer não dispara fetch nenhum. Só busca se o carrinho tem
  // produto-alvo (fralda/pants/absorvente); falha vira lista vazia.
  const temAlvo = (cart?.items || []).some(
    (i) =>
      REGEX_ALVO.test(i.product_title || "") &&
      !REGEX_HIGIENE.test(i.product_title || "")
  )
  const complementos = temAlvo
    ? await listProducts({
        countryCode,
        queryParams: {
          handle: COMPLEMENTOS_DRAWER,
          limit: COMPLEMENTOS_DRAWER.length,
        } as HttpTypes.StoreProductListParams,
      })
        .then(({ response }) => response.products)
        .catch(() => [])
    : []

  return (
    <CartDrawer
      cart={cart}
      complementos={complementos}
      countryCode={countryCode}
    />
  )
}
