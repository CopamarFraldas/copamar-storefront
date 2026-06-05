import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
  /** na confirmação o número já aparece em DESTAQUE no hero — evita duplicar */
  hideNumero?: boolean
}

// Status do Medusa → rótulos em PT-BR (loja brasileira)
const FULFILLMENT_PT: Record<string, string> = {
  not_fulfilled: "Em preparação",
  partially_fulfilled: "Preparação parcial",
  fulfilled: "Preparado",
  partially_shipped: "Envio parcial",
  shipped: "Enviado",
  partially_delivered: "Entrega parcial",
  delivered: "Entregue",
  canceled: "Cancelado",
}

const PAYMENT_PT: Record<string, string> = {
  not_paid: "Não pago",
  awaiting: "Aguardando pagamento",
  authorized: "Autorizado",
  partially_authorized: "Autorizado parcialmente",
  captured: "Pagamento confirmado",
  partially_captured: "Pagamento parcial",
  partially_refunded: "Reembolso parcial",
  refunded: "Reembolsado",
  canceled: "Cancelado",
  requires_action: "Ação necessária",
}

const OrderDetails = ({ order, showStatus, hideNumero }: OrderDetailsProps) => {
  // fallback: troca _ por espaço e capitaliza, caso surja um status não mapeado
  const formatStatus = (map: Record<string, string>, str?: string) => {
    if (!str) return "—"
    if (map[str]) return map[str]
    const formatted = str.split("_").join(" ")
    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  return (
    <div>
      <Text>
        Enviamos a confirmação do pedido para{" "}
        <span
          className="text-ui-fg-medium-plus font-semibold"
          data-testid="order-email"
        >
          {order.email}
        </span>
        .
      </Text>
      <Text className="mt-2">
        Data do pedido:{" "}
        <span data-testid="order-date">
          {new Date(order.created_at).toLocaleDateString("pt-BR")}
        </span>
      </Text>
      {!hideNumero && (
        <Text className="mt-2 text-ui-fg-interactive">
          Número do pedido:{" "}
          <span data-testid="order-id">{order.display_id}</span>
        </Text>
      )}

      <div className="flex items-center text-compact-small gap-x-4 mt-4">
        {showStatus && (
          <>
            <Text>
              Status do pedido:{" "}
              <span className="text-ui-fg-subtle " data-testid="order-status">
                {formatStatus(FULFILLMENT_PT, order.fulfillment_status)}
              </span>
            </Text>
            <Text>
              Status do pagamento:{" "}
              <span
                className="text-ui-fg-subtle "
                data-testid="order-payment-status"
              >
                {formatStatus(PAYMENT_PT, order.payment_status)}
              </span>
            </Text>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails
