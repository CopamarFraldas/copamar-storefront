import { retrieveCart } from "@lib/data/cart"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import {
  COMPLEMENTOS_DRAWER,
  REGEX_ALVO,
  REGEX_HIGIENE,
} from "@modules/products/components/compre-junto/curadoria"
import { buscarIrmaosDaFamilia } from "@modules/products/components/tamanhos-irmaos/familia"
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

  // Tamanhos irmãos das sugestões (luva P·M·G — Marco 10/07): no catálogo
  // cada tamanho é um PRODUTO separado (metadata.familia+tamanho); reusa a
  // MESMA descoberta da PDP (buscarIrmaosDaFamilia). Sem fields explícito =
  // padrão rico do listProducts (preço + inventory), tudo force-cache por
  // tag — o drawer continua abrindo sem fetch. Falha vira "sem chips".
  const irmaosComplementos: Record<string, HttpTypes.StoreProduct[]> = {}
  await Promise.all(
    complementos.map(async (p) => {
      const meta = (p.metadata || {}) as any
      if (!p.handle || !meta.familia || !meta.tamanho) return
      const familia = await buscarIrmaosDaFamilia({
        familia: meta.familia,
        countryCode,
        // em empate de tamanho o dedup mantém ESTE produto — garante que
        // p.id (o handle sugerido, possivelmente já no carrinho) sempre
        // esteja em idsFamilia do client (regra "já levou da família")
        preferId: p.id,
      }).catch(() => [] as HttpTypes.StoreProduct[])
      if (familia.length >= 2) {
        irmaosComplementos[p.handle] = familia
      }
    })
  )

  return (
    <CartDrawer
      cart={cart}
      complementos={complementos}
      irmaosComplementos={irmaosComplementos}
      countryCode={countryCode}
    />
  )
}
