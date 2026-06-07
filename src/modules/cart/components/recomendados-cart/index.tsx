import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import { getRegion } from "@lib/data/regions"

/**
 * "Produtos Recomendados" no carrinho (Marco 07/06, estilo Tena): cross-sell
 * pela categoria dos itens já no carrinho, excluindo o que já está nele.
 */
export default async function RecomendadosCart({
  cart,
}: {
  cart: HttpTypes.StoreCart
}) {
  const countryCode = cart.shipping_address?.country_code || "br"
  const region = await getRegion(countryCode).catch(() => null)
  if (!region) return null

  const idsNoCart = new Set((cart.items || []).map((i: any) => i.product_id))
  // categoria do primeiro item (fonte do cross-sell)
  const primeiro = (cart.items || [])[0] as any
  if (!primeiro?.product_id) return null

  const { response } = await listProducts({
    countryCode,
    queryParams: { id: [primeiro.product_id], limit: 1 } as any,
  }).catch(() => ({ response: { products: [] as HttpTypes.StoreProduct[] } }))
  const catIds = (response.products[0]?.categories || []).map((c: any) => c.id)
  if (!catIds.length) return null

  const { response: rel } = await listProducts({
    countryCode,
    queryParams: { category_id: catIds, limit: 8 } as any,
  }).catch(() => ({ response: { products: [] as HttpTypes.StoreProduct[] } }))

  const sugestoes = (rel.products || [])
    .filter((p) => !idsNoCart.has(p.id))
    .slice(0, 4)
  if (sugestoes.length < 2) return null

  return (
    <section className="mt-12" aria-labelledby="recomendados-h">
      <h2 id="recomendados-h" className="mb-4 text-lg font-semibold text-ui-fg-base">
        Produtos recomendados
      </h2>
      <ul className="grid grid-cols-2 gap-4 small:grid-cols-4">
        {sugestoes.map((p) => (
          <li key={p.id}>
            <ProductPreview product={p} region={region} />
          </li>
        ))}
      </ul>
    </section>
  )
}
