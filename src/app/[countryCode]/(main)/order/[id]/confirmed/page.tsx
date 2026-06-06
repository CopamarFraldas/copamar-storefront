import { retrieveOrder } from "@lib/data/orders"
import GoogleAdsConversion from "@modules/order/components/google-ads-conversion"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}
export const metadata: Metadata = {
  title: "Pedido confirmado",
  description: "Sua compra foi concluída com sucesso",
}

/**
 * new_customer REAL pro Google Ads (#65): o backend conta pedidos anteriores
 * do mesmo e-mail (/store/pedido-meta). Indeterminado → undefined (o campo é
 * omitido na conversão; o Ads aceita sem).
 */
async function ehClienteNovo(orderId: string): Promise<boolean | undefined> {
  try {
    const backend = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
    const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    const r = await fetch(
      `${backend}/store/pedido-meta?order_id=${encodeURIComponent(orderId)}`,
      {
        headers: { "x-publishable-api-key": pk },
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      }
    )
    if (!r.ok) return undefined
    const d = await r.json()
    return typeof d.new_customer === "boolean" ? d.new_customer : undefined
  } catch {
    return undefined
  }
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    return notFound()
  }

  const novo = await ehClienteNovo(order.id)

  return (
    <>
      {/* conversão "COMPRA DO SITE" (#65): valor REAL + nº do pedido, 1x por pedido */}
      <GoogleAdsConversion
        value={Number(order.total) || 0}
        transactionId={String(order.display_id ?? order.id)}
        newCustomer={novo}
      />
      <OrderCompletedTemplate order={order} />
    </>
  )
}
