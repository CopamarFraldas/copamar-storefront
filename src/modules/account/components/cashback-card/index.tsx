import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import type { CashbackSaldo } from "@lib/data/cashback"

/**
 * Card "💰 Meu cashback" do painel do cliente (/account) — mostra o saldo
 * LIBERADO (o que já dá pra usar) e, quando houver, o aviso "R$ X expiram em
 * DD/MM" pra pessoa não perder o prazo de 60 dias. Todos os valores vêm
 * prontos da rota autenticada do backend (getCashbackSaldo) — aqui é só
 * exibição. O card só é renderizado quando o backend respondeu (flag ON).
 */
const CashbackCard = ({ cashback }: { cashback: CashbackSaldo }) => {
  const expira = cashback.proximo_a_expirar
  const dataExpira = expira
    ? new Date(expira.expira_em).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      })
    : null

  return (
    <div
      className="rounded-large border border-ui-border-base bg-copamar-cream px-4 py-3"
      data-testid="cashback-card"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-small-regular text-ui-fg-subtle">
            💰 Meu cashback
          </div>
          <div
            className="mt-1 text-2xl-semi leading-none text-copamar-primary"
            data-testid="cashback-saldo"
            data-value={cashback.saldo_liberado}
          >
            {convertToLocale({
              amount: cashback.saldo_liberado,
              currency_code: "brl",
            })}
          </div>
          {expira && dataExpira && dataExpira !== "Invalid Date" && (
            <div className="mt-1 text-small-regular font-medium text-amber-700">
              {convertToLocale({
                amount: expira.valor,
                currency_code: "brl",
              })}{" "}
              expiram em {dataExpira}
            </div>
          )}
        </div>
        <LocalizedClientLink
          href="/cashback"
          className="shrink-0 text-small-regular font-semibold text-copamar-primary underline"
        >
          Como funciona
        </LocalizedClientLink>
      </div>
      {cashback.saldo_liberado <= 0 && !expira && (
        <p className="mt-2 text-small-regular text-ui-fg-subtle">
          A cada compra, 1% do valor dos produtos vira saldo para a próxima.
        </p>
      )}
    </div>
  )
}

export default CashbackCard
