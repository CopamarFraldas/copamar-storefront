"use client"

import React, { useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { Text } from "@medusajs/ui"

import { aplicarCashback, removerCashback } from "@lib/data/cashback"
import type { CashbackResgate as ResgateInfo } from "@lib/data/cashback"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

/**
 * Box de resgate do cashback no checkout (passo de pagamento/revisão).
 *
 * REGRAS (aprovadas, imutáveis nesta build):
 * - O valor "Usar R$ Y" vem PRONTO do servidor (min(saldo, 30% dos produtos));
 *   aqui NUNCA se calcula teto — só exibimos o que a rota devolveu.
 * - Não cumulativo com cupom manual (mesma regra do PIX5): com cupom no
 *   carrinho o box vira um aviso explicando. CONVIVE com o PIX5 automático.
 * - Trava durante o QR do PIX na tela (copamar_pix_qr_ativo): mudar o total
 *   nessa hora apaga a payment session e o pedido não fecha (incidente 29/06 /
 *   PIX órfão) — mesmo lock do DiscountCode.
 *
 * `resgate` chega do servidor via checkout-form (getCashbackResgate). Depois
 * de aplicar/desfazer, a action revalida a tag do carrinho e o server
 * re-renderiza com o valor novo — o estado da UI é sempre o do servidor.
 */

type Props = {
  cart: HttpTypes.StoreCart
  resgate: ResgateInfo
}

const CashbackResgate: React.FC<Props> = ({ cart, resgate }) => {
  const searchParams = useSearchParams()
  const step = searchParams.get("step")
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = React.useState("")

  // mesmo lock do DiscountCode: PIX com QR na tela → não mexer no total
  const [pixLock, setPixLock] = React.useState(false)
  React.useEffect(() => {
    const ler = () =>
      setPixLock(
        typeof window !== "undefined" &&
          window.sessionStorage.getItem("copamar_pix_qr_ativo") === "1"
      )
    ler()
    window.addEventListener("copamar-pix-qr", ler)
    window.addEventListener("storage", ler)
    return () => {
      window.removeEventListener("copamar-pix-qr", ler)
      window.removeEventListener("storage", ler)
    }
  }, [])

  // só nos passos de pagamento/revisão — antes disso o cliente ainda está
  // preenchendo endereço/frete e o teto de 30% nem faz sentido ainda
  if (step !== "payment" && step !== "review") return null

  // nada a mostrar: sem saldo e sem resgate em andamento
  if (resgate.saldo_liberado <= 0 && resgate.aplicado <= 0) return null

  const brl = (v: number) =>
    convertToLocale({ amount: v, currency_code: cart.currency_code || "brl" })

  // cupom MANUAL no carrinho (PIX5 automático não conta — convive)
  const temCupomManual = (cart.promotions || []).some(
    (p) => p.code && p.code !== "PIX5" && !p.is_automatic
  )

  const aplicar = () => {
    if (pixLock || isPending) return
    setErro("")
    startTransition(async () => {
      const r = await aplicarCashback(cart.id)
      if (!r.ok && r.erro) setErro(r.erro)
    })
  }

  const desfazer = () => {
    if (pixLock || isPending) return
    setErro("")
    startTransition(async () => {
      const r = await removerCashback(cart.id)
      if (!r.ok && r.erro) setErro(r.erro)
    })
  }

  // ✓ já aplicado — confirmação + desfazer
  if (resgate.aplicado > 0) {
    return (
      <div
        className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3"
        data-testid="cashback-aplicado"
      >
        <div className="flex items-center justify-between gap-3">
          <Text className="txt-medium font-semibold text-emerald-700">
            ✓ {brl(resgate.aplicado)} de cashback aplicado
          </Text>
          {pixLock ? (
            <span className="txt-small text-ui-fg-muted">🔒</span>
          ) : (
            <button
              type="button"
              onClick={desfazer}
              disabled={isPending}
              className="txt-small font-medium text-ui-fg-subtle underline disabled:opacity-50"
              data-testid="cashback-desfazer"
            >
              {isPending ? "Removendo…" : "desfazer"}
            </button>
          )}
        </div>
        {erro && <Text className="txt-small text-rose-600 mt-1">{erro}</Text>}
      </div>
    )
  }

  // tem saldo mas tem CUPOM manual → explica (não oferece o botão)
  if (temCupomManual) {
    return (
      <div
        className="rounded-lg border border-ui-border-base bg-ui-bg-subtle px-4 py-3"
        data-testid="cashback-com-cupom"
      >
        <Text className="txt-medium text-ui-fg-subtle">
          💰 Você tem {brl(resgate.saldo_liberado)} de cashback, mas ele não
          acumula com cupom de desconto. Para usar o cashback, remova o cupom
          do carrinho.
        </Text>
      </div>
    )
  }

  // teto do servidor deu zero (ex.: carrinho todo coberto por desconto) → silêncio
  if (resgate.valor_resgatavel <= 0) return null

  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
      data-testid="cashback-oferta"
    >
      <Text className="txt-medium font-semibold text-ui-fg-base">
        💰 Você tem {brl(resgate.saldo_liberado)} de cashback!
      </Text>
      <Text className="txt-small text-ui-fg-subtle mt-0.5">
        Dá para usar até 30% do valor dos produtos desta compra.
      </Text>
      {pixLock ? (
        <Text className="txt-small text-ui-fg-muted mt-2">
          🔒 Cashback travado durante o pagamento PIX
        </Text>
      ) : (
        <button
          type="button"
          onClick={aplicar}
          disabled={isPending}
          className="mt-2 rounded-rounded bg-copamar-primary px-4 py-2 text-sm font-semibold text-white hover:bg-copamar-primary-dark transition-colors disabled:opacity-50"
          data-testid="cashback-aplicar"
        >
          {isPending
            ? "Aplicando…"
            : `Usar ${brl(resgate.valor_resgatavel)} nesta compra`}
        </button>
      )}
      {erro && <Text className="txt-small text-rose-600 mt-2">{erro}</Text>}
    </div>
  )
}

export default CashbackResgate
