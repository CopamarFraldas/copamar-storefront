import { Heading } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import BoletoBox from "@modules/order/components/boleto-box"

/**
 * Cabeçalho da CONFIRMAÇÃO do pedido — caloroso, on-brand (empresa familiar) e
 * ciente da forma de pagamento (Marco 04/06):
 *  - BOLETO aguardando: "Pedido recebido" + re-exibe o boleto pra pagar já.
 *  - PIX/cartão (ou boleto já pago): "Pedido confirmado, pagamento aprovado".
 * + número do pedido em DESTAQUE (é o que o cliente guarda).
 */
const ConfirmationHero = ({ order }: { order: HttpTypes.StoreOrder }) => {
  // nome de QUEM COMPROU (Marco 07/06: pedido do Marco com entrega pro Paulo
  // dizia "confirmado, Paulo!" — shipping é o DESTINATÁRIO da entrega, não o
  // comprador). Ordem: cliente logado → endereço de cobrança → entrega.
  const nome = (
    (order as any).customer?.first_name ||
    order.billing_address?.first_name ||
    order.shipping_address?.first_name ||
    ""
  ).trim()
  const saudacao = nome ? `, ${nome}` : ""

  // pagamento do boleto (provider paghiper) + estado
  const payments = (order.payment_collections ?? []).flatMap(
    (pc: any) => pc.payments ?? []
  )
  const boleto = payments.find((p: any) =>
    String(p?.provider_id ?? "").includes("paghiper-boleto")
  )
  const pago = ["captured", "partially_captured"].includes(
    String(order.payment_status)
  )
  const aguardandoBoleto = Boolean(boleto) && !pago
  const d: any = boleto?.data ?? {}

  return (
    <div className="flex flex-col gap-y-5">
      <Heading
        level="h1"
        className="flex flex-col gap-y-2 text-ui-fg-base text-3xl"
      >
        {aguardandoBoleto ? (
          <>
            <span>Pedido recebido{saudacao}! 🎉</span>
            <span className="text-lg font-normal text-ui-fg-subtle">
              Falta só um passo: pague o boleto abaixo pra gente preparar o seu
              envio.
            </span>
          </>
        ) : (
          <>
            <span>Pedido confirmado{saudacao}! 🎉</span>
            <span className="text-lg font-normal text-ui-fg-subtle">
              Pagamento aprovado — já estamos cuidando de tudo. Qualquer
              novidade chega no seu e-mail.
            </span>
          </>
        )}
      </Heading>

      {/* número do pedido em DESTAQUE */}
      <div
        className="w-fit rounded-xl bg-copamar-primary/10 border border-copamar-primary/30 px-5 py-3"
        data-testid="order-number-highlight"
      >
        <span className="block text-xs uppercase tracking-wide text-ui-fg-subtle">
          Número do pedido
        </span>
        <span className="text-3xl font-bold text-copamar-primary leading-tight">
          nº {order.display_id}
        </span>
      </div>

      {/* boleto à mão pra quem ainda precisa pagar */}
      {aguardandoBoleto && d.linha_digitavel && (
        <BoletoBox
          linhaDigitavel={String(d.linha_digitavel)}
          pdfUrl={d.pdf_url ?? null}
          urlSlip={d.url_slip ?? null}
          vencimento={d.vencimento ?? null}
          referencia={d.referencia_cliente ?? d.paghiper_order_id ?? null}
        />
      )}

      <p className="text-sm text-ui-fg-subtle">
        Obrigado pela confiança — da nossa família pra sua casa, desde 2006. 💙
      </p>
    </div>
  )
}

export default ConfirmationHero
