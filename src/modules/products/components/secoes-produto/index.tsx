"use client"

import { HttpTypes } from "@medusajs/types"
import Accordion from "@modules/products/components/product-tabs/accordion"
import {
  ProductInfoTab,
  ShippingInfoTab,
} from "@modules/products/components/product-tabs"
import ProductInfo from "@modules/products/templates/product-info"
import ProductSpecs from "@modules/products/components/product-specs"

/**
 * Seções da PDP em BARRAS NIVELADAS (Marco 07/06): Descrição ·
 * Especificações · Informações do produto · Entrega e devoluções — todas
 * acordeões irmãos no mesmo estilo (antes specs/abas ficavam DENTRO da
 * descrição colapsável). "Descrição" abre por padrão; o resto fechado pra
 * não comer espaço. Conteúdo permanece no DOM (SEO ok).
 */
export default function SecoesProduto({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  // "Informações do produto" (material/origem/tipo) só entra se houver dado
  // REAL preenchido — o catálogo atual não tem esses campos e a barra abria
  // cheia de traços (Marco 07/06). Peso/EAN/unidades já estão nas specs.
  const temInfoProduto = Boolean(
    product.material ||
      product.origin_country ||
      product.type?.value ||
      product.mid_code ||
      product.hs_code
  )

  const secoes = [
    {
      label: "Descrição",
      component: <ProductInfo product={product} parte="descricao" />,
    },
    {
      label: "Especificações",
      component: <ProductSpecs product={product} semTitulo />,
    },
    ...(temInfoProduto
      ? [
          {
            label: "Informações do produto",
            component: <ProductInfoTab product={product} />,
          },
        ]
      : []),
    {
      label: "Entrega e devoluções",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple" defaultValue={["Descrição"]}>
        {secoes.map((s) => (
          <Accordion.Item
            key={s.label}
            title={s.label}
            headingSize="medium"
            value={s.label}
          >
            <div className="pb-4">{s.component}</div>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}
