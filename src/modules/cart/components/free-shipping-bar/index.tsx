"use client"

import { useEffect, useState } from "react"
import { convertToLocale } from "@lib/util/money"

/**
 * Barra "faltam R$X pro FRETE GRÁTIS" (Marco 07/06, inspirada no site da Tena).
 *
 * REGRA do Marco: só aparece quando o CEP JÁ É CONHECIDO (digitado no consultor
 * de frete — fica no localStorage — ou do endereço do checkout) E o CEP é da
 * zona de entrega própria com frete grátis. Sem CEP, nada é mostrado — senão o
 * cliente de fora da zona acharia que ganha frete grátis e não ganha.
 */
const CEP_KEY = "copamar_cep"

export default function FreeShippingBar({
  subtotal,
  currencyCode = "brl",
  cepConhecido,
}: {
  subtotal: number
  currencyCode?: string
  /** CEP vindo do cart (checkout); sem ele, tenta o localStorage */
  cepConhecido?: string | null
}) {
  const [estado, setEstado] = useState<{
    elegivel: boolean
    minimo: number
  } | null>(null)

  useEffect(() => {
    let cep = (cepConhecido || "").replace(/\D/g, "")
    if (cep.length !== 8) {
      try {
        cep = (localStorage.getItem(CEP_KEY) || "").replace(/\D/g, "")
      } catch {
        /* sem storage */
      }
    }
    if (cep.length !== 8) return // sem CEP → sem barra (regra do Marco)
    let vivo = true
    fetch(`/api/frete-cep?cep=${cep}`)
      .then((r) => r.json())
      .then((d) => {
        if (!vivo) return
        // só zona PRÓPRIA com frete grátis (gratis_minimo presente)
        if (d?.frota_propria && d?.gratis && d?.gratis_minimo) {
          setEstado({ elegivel: true, minimo: Number(d.gratis_minimo) })
        }
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [cepConhecido])

  if (!estado?.elegivel) return null

  const falta = Math.max(0, estado.minimo - subtotal)
  const pct = Math.min(100, Math.round((subtotal / estado.minimo) * 100))

  return (
    <div
      className="rounded-lg border border-copamar-primary/25 bg-copamar-primary/5 px-3 py-2"
      data-testid="free-shipping-bar"
    >
      {falta > 0 ? (
        <p className="text-xs text-ui-fg-base">
          Faltam{" "}
          <strong className="text-copamar-primary">
            {convertToLocale({ amount: falta, currency_code: currencyCode })}
          </strong>{" "}
          pra você ganhar <strong>FRETE GRÁTIS</strong> 🚚
        </p>
      ) : (
        <p className="text-xs font-medium text-green-700 dark:text-green-400">
          🎉 Você ganhou <strong>FRETE GRÁTIS</strong> nesta compra!
        </p>
      )}
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ui-bg-subtle">
        <div
          className={`h-full rounded-full transition-all duration-500 ${falta > 0 ? "bg-copamar-primary" : "bg-green-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
