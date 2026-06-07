"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "Informações do produto",
      component: <ProductInfoTab product={product} />,
    },
    {
      label: "Entrega e devoluções",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

export const ProductInfoTab = ({ product }: ProductTabsProps) => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-2 gap-x-8">
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">Material</span>
            <p>{product.material ? product.material : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">País de origem</span>
            <p>{product.origin_country ? product.origin_country : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">Tipo</span>
            <p>{product.type ? product.type.value : "-"}</p>
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">Peso</span>
            <p>{product.weight ? `${product.weight} g` : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">Dimensões</span>
            <p>
              {product.length && product.width && product.height
                ? `${product.length}C × ${product.width}L × ${product.height}A`
                : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">Entrega rápida</span>
            <p className="max-w-sm">
              Seu pedido chega em 3 a 5 dias úteis no ponto de retirada ou
              no conforto da sua casa.*
            </p>
            <p className="max-w-sm mt-1 text-xs text-ui-fg-subtle">
              *Prazo válido para as regiões atendidas pela nossa entrega
              própria (as mesmas do frete grátis). Para as demais regiões,
              o prazo aparece ao calcular o frete pelo CEP.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <span className="font-semibold">Trocas simples</span>
            <p className="max-w-sm">
              Produto não atendeu? Sem problema — fazemos a troca por um
              novo, rapidinho, conforme as regras do Código de Defesa do
              Consumidor: até 7 dias após o recebimento e com a embalagem
              lacrada (produto de higiene com pacote violado não pode ser
              trocado). Defeito de fábrica? Troca em até 30 dias, mesmo
              aberto.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <span className="font-semibold">Devolução fácil</span>
            <p className="max-w-sm">
              É só devolver o produto que reembolsamos seu dinheiro,
              conforme as regras do CDC. Sem burocracia — cuidamos pra que
              a devolução seja simples e tranquila. Detalhes na nossa{" "}
              <LocalizedClientLink
                href="/trocas-e-devolucoes"
                className="underline underline-offset-2 hover:text-ui-fg-base"
              >
                política de Trocas e Devoluções
              </LocalizedClientLink>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
