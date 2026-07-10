import { retrieveOrder } from "@lib/data/orders"
import { getEntregaProgramadaConfig } from "@lib/data/entrega-programada"
import OrderDetailsTemplate from "@modules/order/templates/order-details-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    notFound()
  }

  return {
    title: `Pedido #${order.display_id}`,
    description: `Detalhes do pedido`,
  }
}

export default async function OrderDetailPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    notFound()
  }

  // flag copamar_kv 'entrega_programada' (fail-closed) — o template é client
  // component, então quem lê é a page e passa por prop
  const { ativo: entregaProgramadaAtiva } = await getEntregaProgramadaConfig()

  return (
    <OrderDetailsTemplate
      order={order}
      entregaProgramadaAtiva={entregaProgramadaAtiva}
    />
  )
}
