import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ReviewsBadge from "@modules/common/components/reviews-badge"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
  /** "cabecalho" = só collection+título+badge; "descricao" = só o texto.
   *  Permite à PDP mobile mostrar o título em cima e a descrição colapsada
   *  embaixo (Marco 07/06). Sem a prop, renderiza tudo (compat). */
  parte?: "cabecalho" | "descricao"
}

const ProductInfo = ({ product, parte }: ProductInfoProps) => {
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

            {/* prova social real da loja (C1) */}
            <ReviewsBadge />
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
