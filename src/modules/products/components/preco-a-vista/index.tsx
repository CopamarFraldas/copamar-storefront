import { convertToLocale } from "@lib/util/money"

/**
 * Preço à vista (−5%) em verde, abaixo do preço normal (Marco 22/06).
 * Mesmo desconto da promoção PIX5 do checkout: PIX, dinheiro, débito ou
 * retirada/pagamento na loja. Card = linha curta; PDP (`full`) = + explicação.
 */
const DESC_AVISTA = 0.05 // 5%

export default function PrecoAVista({
  amount,
  currency_code,
  full = false,
}: {
  amount?: number | null
  currency_code?: string
  full?: boolean
}) {
  if (!amount || amount <= 0 || !currency_code) return null
  // arredonda em centavos pra não pegar dízima de ponto flutuante
  const aVista = Math.round(amount * (1 - DESC_AVISTA) * 100) / 100
  const fmt = convertToLocale({ amount: aVista, currency_code })

  // emerald-700: o 600 dava 3,76:1 de contraste (reprova WCAG AA) — a
  // sublinha do modo `full` já usava 700, então padroniza no mais escuro
  return (
    <span
      className={`block text-emerald-700 dark:text-emerald-400 leading-tight font-bold ${
        full ? "text-lg sm:text-xl" : "text-sm small:text-base medium:text-lg"
      }`}
      data-testid="preco-a-vista"
    >
      {fmt} à vista <span className="font-semibold">· 5% OFF</span>
      {full && (
        <span className="mt-0.5 block text-xs font-normal text-emerald-700 dark:text-emerald-400/90">
          no PIX, dinheiro, débito ou retirando na loja
        </span>
      )}
    </span>
  )
}
