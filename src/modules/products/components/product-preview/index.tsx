import { Text } from "@medusajs/ui"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { isProductOutOfStock, avisoEstoque, unidadesRestantes } from "@lib/util/stock"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SeloAbsorcao from "@modules/common/components/selo-absorcao"
import Estrelas from "@modules/common/components/estrelas"
import type { ReviewsAgg } from "@lib/data/reviews"
import Thumbnail from "../thumbnail"
import CompararCheckbox from "../comparar/checkbox"
import PreviewPrice from "./price"
import AddToCartButton from "./add-to-cart-button"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
  reviews,
  comparavel,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  /** agregado de avaliações vindo em LOTE do listing (getReviewsAggregates) —
   *  NUNCA buscar por card. Sem prop/sem avaliação → card sem estrelas. */
  reviews?: ReviewsAgg | null
  /** liga o "⚖ Comparar" — só nos grids da loja/busca (opt-in por prop pra
   *  NÃO aparecer nos rails da home, relacionados e recomendados do carrinho) */
  comparavel?: boolean
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
  // selo "Últimas N unidades" — só com estoque REAL baixo (0 < N <= 10);
  // unidadesRestantes devolve null quando não dá pra afirmar (backorder,
  // sem controle de estoque ou inventory_quantity ausente na query)
  const restantes = unidadesRestantes(product)
  const poucasUnidades = !esgotado && restantes !== null && restantes <= 10

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
          {/* selo discreto de estoque baixo — mesmo lugar do "Esgotado", mas âmbar */}
          {poucasUnidades && (
            <span
              className="absolute left-2 top-2 z-10 inline-flex items-center rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/70 dark:text-amber-100 text-[10px] font-semibold px-2 py-1 shadow-sm"
              data-testid="selo-poucas-unidades"
            >
              {restantes === 1
                ? "Última unidade"
                : `Últimas ${restantes} unidades`}
            </span>
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
          {/* estrelinhas (avaliações first-party) — padrão Amazon/ML */}
          {reviews && reviews.total > 0 && (
            <span className="flex items-center gap-1">
              <Estrelas media={reviews.media} tamanho="xs" />
              <span className="text-xs text-ui-fg-subtle">({reviews.total})</span>
            </span>
          )}
          {cheapestPrice && (
            <div className="flex flex-col min-w-0">
              <PreviewPrice price={cheapestPrice} productTitle={product.title} />
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
        {/* comparador: fora do link do card (marcar nunca navega) */}
        {comparavel && product.handle && (
          <CompararCheckbox
            handle={product.handle}
            title={product.title || product.handle}
            thumbnail={product.thumbnail || product.images?.[0]?.url || null}
          />
        )}
      </div>
    </div>
  )
}
