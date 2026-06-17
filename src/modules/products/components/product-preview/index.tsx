import { Text } from "@medusajs/ui"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { isProductOutOfStock, avisoEstoque } from "@lib/util/stock"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SeloAbsorcao from "@modules/common/components/selo-absorcao"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import AddToCartButton from "./add-to-cart-button"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  // const pricedProduct = await listProducts({
  //   regionId: region.id,
  //   queryParams: { id: [product.id!] },
  // }).then(({ response }) => response.products[0])

  // if (!pricedProduct) {
  //   return null
  // }

  const { cheapestPrice } = getProductPrice({
    product,
  })

  const esgotado = isProductOutOfStock(product)
  const aviso = avisoEstoque(product)

  return (
    // O botão "Adicionar" precisa ficar FORA do <a> (botão dentro de link é HTML
    // inválido + warning de hidratação). Então o link envolve só a área
    // navegável (foto/título/preço) e o AddToCartButton vira irmão dele.
    <div className="group" data-testid="product-wrapper">
      <LocalizedClientLink href={`/products/${product.handle}`} className="block">
        {/* wrapper relative pra posicionar o selo "ESGOTADO" sobre a thumbnail */}
        <div className="relative">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
            title={product.title}
          />
          {esgotado && (
            <>
              {/* selo no canto superior esquerdo */}
              <span className="absolute left-2 top-2 z-10 inline-flex items-center rounded-full bg-red-600 text-white text-[10px] font-semibold uppercase tracking-wide px-2 py-1 shadow-sm">
                Esgotado
              </span>
              {/* foto desbotada pra reforçar a indisponibilidade */}
              <div aria-hidden className="absolute inset-0 bg-white/40 dark:bg-black/40 rounded-large pointer-events-none" />
            </>
          )}
        </div>
        <div className="flex txt-compact-medium mt-4 justify-between">
          <Text className="text-ui-fg-subtle" data-testid="product-title">
            {product.title}
          </Text>
          <div className="flex items-center gap-x-2">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
        </div>
        {/* selo de nível de absorção (#87) — null se o produto não tem nível validado */}
        <SeloAbsorcao product={product} variante="card" />
      </LocalizedClientLink>
      {esgotado && aviso && (
        <p className="mt-1 text-[11px] text-ui-fg-subtle leading-snug">{aviso}</p>
      )}
      {!esgotado && <AddToCartButton product={product} />}
    </div>
  )
}
