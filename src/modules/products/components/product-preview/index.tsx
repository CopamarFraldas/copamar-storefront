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
    <div className="group flex h-full flex-col" data-testid="product-wrapper">
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
        {/* STACK vertical (mobile-safe): nome em cima, bloco de preço embaixo —
            cada um na própria linha. O layout antigo era flex-row justify-between
            (nome à esq / preço à dir): na coluna estreita do mobile o nome quebrava
            em várias linhas e o preço (maior) caía no MEIO dele, e o verde "à vista"
            (dentro de um flex-row) vazava pro card vizinho. Agora: flex-col com o
            preço empilhado (principal sobre o verde) e título com clamp p/ alinhar. */}
        <div className="flex flex-col gap-y-1 mt-4 min-w-0">
          <Text
            className="text-ui-fg-subtle txt-compact-medium small:text-base medium:text-lg line-clamp-2 min-h-[2.5em]"
            data-testid="product-title"
          >
            {product.title}
          </Text>
          {cheapestPrice && (
            <div className="flex flex-col min-w-0">
              <PreviewPrice price={cheapestPrice} />
            </div>
          )}
        </div>
        {/* selo de nível de absorção (#87) — null se o produto não tem nível validado */}
        <SeloAbsorcao product={product} variante="card" />
      </LocalizedClientLink>
      {/* bloco de baixo ANCORADO no rodapé (mt-auto) → botões alinham entre os
          cards mesmo com nomes de tamanhos diferentes (Marco 30/06) */}
      <div className="mt-auto pt-2">
        {esgotado && aviso && (
          <p className="text-[11px] text-ui-fg-subtle leading-snug">{aviso}</p>
        )}
        {!esgotado && <AddToCartButton product={product} />}
      </div>
    </div>
  )
}
