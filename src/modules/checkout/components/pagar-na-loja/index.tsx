"use client"

import { useState } from "react"
import { Button, Text } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { initiatePaymentSession, placeOrder } from "@lib/data/cart"
import { validarEstoqueCarrinho } from "@lib/data/estoque"
import ErrorMessage from "@modules/checkout/components/error-message"

/**
 * "Pagar na loja" (Marco 18/06) — só aparece na RETIRADA NA LOJA. Usa o provider
 * manual nativo do Medusa (pp_system_default): cria a sessão e conclui o pedido
 * SEM cobrança online; o cliente paga no caixa na hora da retirada. Ganha os 5%
 * à vista (igual PIX), aplicado no passo de pagamento. Mesmo guard de
 * NEXT_REDIRECT dos demais (o placeOrder navega via redirect do Next).
 */
const PagarNaLoja = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function concluir() {
    if (loading) return
    setError(null)
    setLoading(true)
    try {
      // gate anti-oversell (#46): saldo FRESCO antes de fechar o pedido
      const estoque = await validarEstoqueCarrinho()
      if (!estoque.ok) {
        setError(estoque.mensagem)
        setLoading(false)
        return
      }
      await initiatePaymentSession(cart, { provider_id: "pp_system_default" })
      await placeOrder()
    } catch (e: any) {
      // NEXT_REDIRECT = sucesso (o placeOrder navega via redirect do Next)
      if (
        String(e?.message || "").includes("NEXT_REDIRECT") ||
        e?.digest?.includes?.("NEXT_REDIRECT")
      ) {
        throw e
      }
      setError(e?.message || "Não foi possível concluir o pedido. Tente de novo.")
      setLoading(false)
    }
  }

  return (
    <div className="mt-6">
      <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
        ✅ 5% de desconto aplicado no total
      </p>
      <Text className="text-sm text-ui-fg-subtle mb-4">
        Você paga <strong>na hora da retirada</strong>, no caixa da loja (Santo
        André). Já fica <strong>reservado pra você</strong> — é só passar na
        loja pra retirar.
      </Text>
      <Button
        onClick={concluir}
        isLoading={loading}
        size="large"
        className="w-full"
        data-testid="pagar-na-loja-button"
      >
        Concluir pedido (pagar na loja)
      </Button>
      <ErrorMessage error={error} data-testid="pagar-na-loja-error" />
    </div>
  )
}

export default PagarNaLoja
