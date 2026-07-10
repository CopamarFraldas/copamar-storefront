import { Heading } from "@medusajs/ui"
import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import ConfirmationHero from "@modules/order/components/confirmation-hero"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import LembreteRecompra from "@modules/order/components/lembrete-recompra"
import EntregaProgramada from "@modules/order/components/entrega-programada"
import { getEntregaProgramadaConfig } from "@lib/data/entrega-programada"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import RetiradaAviso from "@modules/order/components/retirada-aviso"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  // celular do pedido (entrega → cobrança → cliente) — decide se o bloco
  // "Me lembre de repor" aparece (lembrete é via WhatsApp)
  const celular = String(
    order.shipping_address?.phone ||
      order.billing_address?.phone ||
      (order as any).customer?.phone ||
      ""
  ).replace(/\D/g, "")
  const temCelular = celular.length >= 10

  // 📦 Entrega Programada: só oferece com a flag copamar_kv ON (fail-closed) —
  // e com celular (o ciclo chega por WhatsApp). Convive com o lembrete: o
  // lembrete é UM toque avulso, a entrega programada é RECORRENTE com 5%.
  const { ativo: epAtiva } = temCelular
    ? await getEntregaProgramadaConfig()
    : { ativo: false }

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <div
          className="flex flex-col gap-4 max-w-4xl h-full bg-ui-bg-base w-full py-10"
          data-testid="order-complete-container"
        >
          {/* hero caloroso + ciente da forma de pagamento (boleto re-exibido)
              + nº do pedido em destaque (Marco 04/06) */}
          <ConfirmationHero order={order} />
          <RetiradaAviso order={order} />
          <OrderDetails order={order} hideNumero />
          {/* "Me lembre de repor" — só se o pedido TEM celular (o lembrete é
              por WhatsApp; sem número não tem como avisar) */}
          {temCelular && (
            <LembreteRecompra orderId={order.id} displayId={order.display_id} />
          )}
          {/* 📦 recorrente com 5% — logo abaixo do lembrete avulso */}
          {epAtiva && (
            <EntregaProgramada
              orderId={order.id}
              displayId={order.display_id}
            />
          )}
          <Heading level="h2" className="flex flex-row text-3xl-regular">
            Resumo
          </Heading>
          <Items order={order} />
          <CartTotals totals={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
        </div>
      </div>
    </div>
  )
}
