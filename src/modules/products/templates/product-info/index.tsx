import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ReviewsBadge from "@modules/common/components/reviews-badge"
import Estrelas from "@modules/common/components/estrelas"
import type { ReviewsAgg } from "@lib/data/reviews"
import Compartilhar from "@modules/products/components/compartilhar"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
  /** "cabecalho" = só collection+título+badge; "descricao" = só o texto.
   *  Permite à PDP mobile mostrar o título em cima e a descrição colapsada
   *  embaixo (Marco 07/06). Sem a prop, renderiza tudo (compat). */
  parte?: "cabecalho" | "descricao"
  /** avaliações DESTE produto (first-party) — estrelas pequenas sob o título */
  reviewsAgg?: ReviewsAgg | null
  /** segmento de país da rota (ex.: "br") — o Compartilhar usa pra montar a
   *  URL canônica da PDP. Opcional por compat; default "br". */
  countryCode?: string
}

const ProductInfo = ({
  product,
  parte,
  reviewsAgg,
  countryCode,
}: ProductInfoProps) => {
  const mostraCabecalho = parte !== "descricao"
  const mostraDescricao = parte !== "cabecalho"
  return (
    <div id={parte === "descricao" ? "product-info-desc" : "product-info"}>
      <div className="flex flex-col gap-y-4 lg:max-w-[500px] mx-auto">
        {mostraCabecalho && (
          <>
            {product.collection && (
              <LocalizedClientLink
                href={`/collections/${product.collection.handle}`}
                className="text-medium text-ui-fg-subtle hover:text-ui-fg-subtle"
              >
                {product.collection.title}
              </LocalizedClientLink>
            )}
            {/* título = h1 da página (era h2, página ficava sem h1). Maior no
                PC (Marco 09/06) pra não "boiar" na largura. */}
            <Heading
              level="h1"
              className="text-3xl leading-tight text-ui-fg-base small:text-[2.5rem] small:leading-[1.1]"
              data-testid="product-title"
            >
              {product.title}
            </Heading>

            {/* estrelas DO PRODUTO (avaliações first-party) — âncora pra seção.
                Só quando existe avaliação; agregado server-side (pode atrasar
                até 5 min, a seção embaixo é a fresca). */}
            {reviewsAgg && reviewsAgg.total > 0 && (
              <a
                href="#avaliacoes"
                className="-mt-2 flex w-fit items-center gap-1.5 hover:underline"
                aria-label={`Nota ${reviewsAgg.media.toFixed(1).replace(".", ",")} de 5 — ver as ${reviewsAgg.total} avaliações`}
              >
                <Estrelas media={reviewsAgg.media} tamanho="sm" />
                <span className="text-sm font-semibold text-ui-fg-base">
                  {reviewsAgg.media.toFixed(1).replace(".", ",")}
                </span>
                <span className="text-sm text-copamar-primary">
                  ({reviewsAgg.total}{" "}
                  {reviewsAgg.total === 1 ? "avaliação" : "avaliações"})
                </span>
              </a>
            )}

            {/* prova social real da LOJA (C1) + COMPARTILHAR na mesma linha.
                escopo="loja" deixa claro que a nota 4,9/600 é da Copamar no
                Google, não daquela fralda (Marco 09/06). O Compartilhar é
                discreto à direita; flex-wrap desce ele sozinho no mobile
                estreito sem empurrar o badge (Marco 06/07). */}
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <ReviewsBadge escopo="loja" />
              {product.handle && (
                <Compartilhar
                  titulo={product.title}
                  handle={product.handle}
                  countryCode={countryCode || "br"}
                />
              )}
            </div>
          </>
        )}

        {mostraDescricao && (
          <Text
            className="text-medium text-ui-fg-subtle whitespace-pre-line"
            data-testid="product-description"
          >
            {product.description}
          </Text>
        )}
      </div>
    </div>
  )
}

export default ProductInfo
