"use client"

import { useEffect, useState } from "react"

import { convertToLocale } from "@lib/util/money"

/**
 * Selo discreto "💰 Este pedido gera R$ X de cashback (1%)" no resumo do
 * carrinho/checkout — só quando CASHBACK_ATIVO (config via proxy
 * /api/cashback-config, padrão chega-amanha: fail-closed → silêncio).
 *
 * A conta aqui é só a PRÉVIA de exibição: percentual × (produtos − descontos),
 * espelhando a regra "1% dos produtos pagos, excluindo frete e valor coberto
 * por cupom/desconto". O crédito REAL é calculado e gravado no backend na
 * hora do pagamento — divergência de centavos resolve a favor do servidor.
 * (O teto de RESGATE de 30% é outra história e NUNCA é calculado no client.)
 */

type Config = { ativo: boolean; percentual?: number }

// cache por carregamento de página (module-level): o selo aparece no carrinho
// E no checkout — sem isso seriam 2+ fetches idênticos por navegação
let configPromise: Promise<Config> | null = null
const getConfig = (): Promise<Config> => {
  if (!configPromise) {
    configPromise = fetch("/api/cashback-config", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { ativo: false }))
      .catch(() => ({ ativo: false }))
  }
  return configPromise
}

const CashbackSelo = ({
  totals,
  className = "",
}: {
  totals: {
    item_subtotal?: number | null
    discount_subtotal?: number | null
    currency_code?: string | null
  }
  className?: string
}) => {
  const [config, setConfig] = useState<Config | null>(null)

  useEffect(() => {
    let vivo = true
    getConfig().then((c) => {
      if (vivo) setConfig(c)
    })
    return () => {
      vivo = false
    }
  }, [])

  if (!config?.ativo) return null

  const percentual =
    typeof config.percentual === "number" && config.percentual > 0
      ? config.percentual
      : 1
  const base = Math.max(
    0,
    (totals.item_subtotal ?? 0) - (totals.discount_subtotal ?? 0)
  )
  const valor = Math.floor(base * percentual) / 100 // 1% → centavos, sem arredondar pra cima

  if (valor <= 0) return null

  return (
    <p
      className={`flex items-center gap-x-1.5 text-xs text-ui-fg-subtle ${className}`}
      data-testid="cashback-selo"
    >
      <span aria-hidden>💰</span>
      <span>
        Este pedido gera{" "}
        <strong className="font-semibold text-emerald-700">
          {convertToLocale({
            amount: valor,
            currency_code: totals.currency_code || "brl",
          })}
        </strong>{" "}
        de cashback ({percentual}%)
      </span>
    </p>
  )
}

export default CashbackSelo
