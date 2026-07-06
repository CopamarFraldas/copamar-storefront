import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ReviewsBadge from "@modules/common/components/reviews-badge"
import Compartilhar from "@modules/products/components/compartilhar"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
  /** "cabecalho" = só collection+título+badge; "descricao" = só o texto.
   *  Permite à PDP mobile mostrar o título em cima e a descrição colapsada
   *  embaixo (Marco 07/06). Sem a prop, renderiza tudo (compat). */
  parte?: "cabecalho" | "descricao"
  /** segmento de país da rota (ex.: "br") — o Compartilhar usa pra montar a
   *  URL canônica da PDP. Opcional por compat; default "br". */
  countryCode?: string
}

const ProductInfo = ({ product, parte, countryCode }: ProductInfoProps) => {
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
