import { Container } from "@medusajs/ui"

import ChevronDown from "@modules/common/icons/chevron-down"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CashbackCard from "@modules/account/components/cashback-card"
import { convertToLocale } from "@lib/util/money"
import type { CashbackSaldo } from "@lib/data/cashback"
import { HttpTypes } from "@medusajs/types"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
  /** saldo do programa de cashback — null (flag OFF/falha) esconde o card */
  cashback?: CashbackSaldo | null
}

/** Cartãozinho de número (Cliente desde / Pedidos / Endereços) — mobile-first. */
const Stat = ({ valor, rotulo }: { valor: string | number; rotulo: string }) => (
  <div className="flex-1 min-w-[100px] rounded-large border border-ui-border-base bg-ui-bg-subtle px-4 py-3">
    <div className="text-2xl-semi leading-none text-copamar-primary">{valor}</div>
    <div className="mt-1 text-small-regular text-ui-fg-subtle">{rotulo}</div>
  </div>
)

const STATUS_PT: Record<string, { txt: string; cor: string }> = {
  pending: { txt: "Em processamento", cor: "text-amber-600" },
  completed: { txt: "Concluído", cor: "text-emerald-600" },
  canceled: { txt: "Cancelado", cor: "text-red-500" },
  archived: { txt: "Arquivado", cor: "text-ui-fg-subtle" },
  requires_action: { txt: "Requer ação", cor: "text-amber-600" },
}

const Overview = ({ customer, orders, cashback }: OverviewProps) => {
  const anoDesde = customer?.created_at
    ? new Date(customer.created_at as any).getFullYear()
    : null
  const numPedidos = (customer as any)?.orders?.length ?? orders?.length ?? 0

  return (
    <div data-testid="overview-page-wrapper">
      {/* saudação: SÓ desktop (no mobile o nav já mostra "Olá, {nome}" + menu —
          evita duplicar). Os stats + pedidos recentes aparecem em todo tamanho. */}
      <div className="mb-6">
        <div className="hidden small:block">
          <h1
            className="text-2xl-semi text-ui-fg-base"
            data-testid="welcome-message"
            data-value={customer?.first_name}
          >
            Olá, {customer?.first_name} 👋
          </h1>
          <p className="mt-1 text-base-regular text-ui-fg-subtle" data-testid="customer-email">
            {customer?.email}
          </p>
        </div>

        <div className="mt-2 small:mt-4 flex flex-wrap gap-3">
          {anoDesde && (
            <Stat valor={anoDesde} rotulo="Cliente Copamar desde" />
          )}
          <Stat
            valor={numPedidos}
            rotulo={numPedidos === 1 ? "pedido feito" : "pedidos feitos"}
          />
          <Stat
            valor={customer?.addresses?.length || 0}
            rotulo="endereços salvos"
          />
        </div>

        {/* 💰 Meu cashback — só aparece com o programa LIGADO (dado do backend) */}
        {cashback && (
          <div className="mt-3">
            <CashbackCard cashback={cashback} />
          </div>
        )}
      </div>

      {/* pedidos recentes — também visível no mobile */}
      <div className="flex flex-col gap-y-4 border-t border-ui-border-base pt-6">
        <h3 className="text-large-semi text-ui-fg-base">Pedidos recentes</h3>
        <ul className="flex flex-col gap-y-3" data-testid="orders-wrapper">
          {orders && orders.length > 0 ? (
            orders.slice(0, 5).map((order) => {
              const st = STATUS_PT[order.status as string]
              return (
                <li key={order.id} data-testid="order-wrapper" data-value={order.id}>
                  <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
                    <Container className="flex items-center justify-between gap-3 p-4 hover:bg-ui-bg-base-hover transition-colors">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-base-regular font-medium text-ui-fg-base">
                          Pedido #{order.display_id}
                        </span>
                        <span className="text-small-regular text-ui-fg-subtle">
                          {new Date(order.created_at).toLocaleDateString("pt-BR")}
                          {" · "}
                          {convertToLocale({
                            amount: order.total,
                            currency_code: order.currency_code,
                          })}
                        </span>
                        {st && (
                          <span className={`text-small-regular font-medium ${st.cor}`}>
                            {st.txt}
                          </span>
                        )}
                      </div>
                      <ChevronDown className="-rotate-90 shrink-0 text-ui-fg-muted" />
                    </Container>
                  </LocalizedClientLink>
                </li>
              )
            })
          ) : (
            <span className="text-base-regular text-ui-fg-subtle" data-testid="no-orders-message">
              Você ainda não tem pedidos por aqui.
            </span>
          )}
        </ul>
      </div>
    </div>
  )
}

export default Overview
