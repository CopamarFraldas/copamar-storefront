"use client"

import { XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import OrderSummary from "@modules/order/components/order-summary"
import RastreioEntrega from "@modules/order/components/rastreio-entrega"
import AcoesPedido from "@modules/order/components/acoes-pedido"
import ShippingDetails from "@modules/order/components/shipping-details"
import React from "react"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
}) => {
  return (
    <div className="flex flex-col justify-center gap-y-4">
      <div className="flex gap-2 justify-between items-center">
        <h1 className="text-2xl-semi">Detalhes do pedido</h1>
        <LocalizedClientLink
          href="/account/orders"
          className="flex gap-2 items-center text-ui-fg-subtle hover:text-ui-fg-base"
          data-testid="back-to-overview-button"
        >
          <XMark /> Voltar pra Minha conta
        </LocalizedClientLink>
      </div>
      <div
        className="flex flex-col gap-4 h-full bg-ui-bg-base w-full"
        data-testid="order-details-container"
      >
        <OrderDetails order={order} showStatus />
        <RastreioEntrega
          orderId={order.id}
          blingOrderId={(order.metadata as any)?.bling_order_id}
          createdAt={order.created_at as any}
        />
        <AcoesPedido
          orderId={order.id}
          displayId={order.display_id}
          countryCode={(order.shipping_address?.country_code as any) || "br"}
        />
        <Items order={order} />
        <ShippingDetails order={order} />
        <OrderSummary order={order} />
        <Help />
      </div>
    </div>
  )
}

export default OrderDetailsTemplate
