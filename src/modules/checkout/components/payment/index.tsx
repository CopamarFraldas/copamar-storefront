"use client"

import { isPagBank, isPagHiperBoleto, isManual, paymentInfoMap } from "@lib/constants"
import { setDescontoPix } from "@lib/data/cart"
import { CheckCircleSolid } from "@medusajs/icons"
import { Heading, Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import PagBankPix from "@modules/checkout/components/pagbank-pix"
import PagBankCard from "@modules/checkout/components/pagbank-card"
import PagHiperBoleto from "@modules/checkout/components/paghiper-boleto"
import PagarNaLoja from "@modules/checkout/components/pagar-na-loja"
import Divider from "@modules/common/components/divider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

/**
 * Pagamento — 3 FORMAS ACHATADAS (Marco 18/06): PIX · Cartão · Boleto, cada uma
 * direta (sem sub-menu). Antes o PagBank era 1 opção que abria um sub-toggle
 * PIX|Cartão — confundia. PIX e Cartão são o MESMO provider PagBank (data.method
 * diferente); Boleto é o PagHiper. Cada painel conduz até a confirmação sozinho.
 */
type Opcao = "pix" | "card" | "boleto" | "loja" | ""

const Payment = ({
  cart,
  availablePaymentMethods,
  availableShippingMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
  availableShippingMethods?: any[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (s: any) => s.status === "pending"
  )
  const [error, setError] = useState<string | null>(null)

  // provider ids reais: PagBank (PIX+Cartão) e PagHiper (Boleto)
  const pagbankId =
    availablePaymentMethods?.find((m) => isPagBank(m.id))?.id || ""
  const boletoId =
    availablePaymentMethods?.find((m) => isPagHiperBoleto(m.id))?.id || ""
  const lojaId =
    availablePaymentMethods?.find((m) => isManual(m.id))?.id || ""

  // RETIRADA NA LOJA: detecta pelo TIPO do fulfillment set (pickup) do frete
  // escolhido — robusto a renome (não depende do nome "Retirar na loja").
  const selectedShippingOptionId =
    cart?.shipping_methods?.[(cart?.shipping_methods?.length ?? 0) - 1]
      ?.shipping_option_id
  const isPickup = !!availableShippingMethods?.some(
    (o: any) =>
      o.id === selectedShippingOptionId &&
      o.service_zone?.fulfillment_set?.type === "pickup"
  )

  // estado inicial: se a sessão ativa é boleto, marca boleto; com qualquer OUTRA
  // sessão ativa começa vazio (PagBank não distingue PIX/Cartão — o cliente
  // re-escolhe; nunca sobrescrever o que já existe). SEM sessão nenhuma, o PIX
  // já vem pré-selecionado — SÓ o estado do radio: nenhuma payment session é
  // criada no mount (o QR do PagBankPix só nasce no clique em "Gerar PIX") e o
  // desconto PIX5 entra pelo MESMO useEffect de sempre, idêntico ao clique
  // manual (incidente "PIX órfão": trocar método após o QR apaga a sessão).
  const [opcao, setOpcao] = useState<Opcao>(() => {
    if (activeSession) {
      return isPagHiperBoleto(activeSession.provider_id) ? "boleto" : ""
    }
    // pré-seleciona só se o PIX (PagBank) está de fato disponível
    return pagbankId ? "pix" : ""
  })

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isOpen = searchParams.get("step") === "payment"

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0
  const paymentReady =
    (activeSession && cart?.shipping_methods?.length !== 0) || paidByGiftcard

  const handleEdit = () => {
    const params = new URLSearchParams(searchParams)
    params.set("step", "payment")
    router.push(pathname + "?" + params.toString(), { scroll: false })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  // se trocar pra retirada, cartão/boleto não valem mais (e "loja" não vale fora
  // da retirada) — reseta a opção pra não ficar um painel órfão selecionado.
  useEffect(() => {
    if (isPickup && (opcao === "card" || opcao === "boleto")) setOpcao("")
    if (!isPickup && opcao === "loja") setOpcao("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPickup])

  // 5% à vista (Marco 09/06 + 18/06): PIX, BOLETO e PAGAR-NA-LOJA ganham; cartão
  // não. Promoção do Medusa → vale no TOTAL. NÃO é cumulativo (é o mesmo 5%).
  useEffect(() => {
    if (!isOpen) return
    setDescontoPix(
      opcao === "pix" || opcao === "boleto" || opcao === "loja"
    ).catch(() => {})
  }, [isOpen, opcao])

  // formas achatadas. RETIRADA → PIX + Pagar na loja; ENTREGA → PIX/Cartão/Boleto.
  const OPCOES = (
    isPickup
      ? ([
          { key: "pix", titulo: "PIX", sub: "5% de desconto · aprovação na hora" },
          { key: "loja", titulo: "Pagar na loja", sub: "5% de desconto · paga na retirada" },
        ] as { key: Exclude<Opcao, "">; titulo: string; sub: string }[])
      : ([
          { key: "pix", titulo: "PIX", sub: "5% de desconto · aprovação na hora" },
          { key: "card", titulo: "Cartão de crédito", sub: "em até 3x" },
          { key: "boleto", titulo: "Boleto bancário", sub: "5% de desconto · vence em 3 dias" },
        ] as { key: Exclude<Opcao, "">; titulo: string; sub: string }[])
  ).filter((o) =>
    o.key === "boleto" ? !!boletoId : o.key === "loja" ? !!lojaId : !!pagbankId
  )

  const fiscalDoc = cart?.metadata?.fiscal_documento as string
  const defaultHolder = [
    cart?.billing_address?.first_name,
    cart?.billing_address?.last_name,
  ]
    .filter(Boolean)
    .join(" ")

  const tituloDe = (k: Opcao) =>
    k === "pix"
      ? "PIX"
      : k === "card"
      ? "Cartão de crédito"
      : k === "boleto"
      ? "Boleto bancário"
      : k === "loja"
      ? "Pagar na loja"
      : ""

  return (
    <div className="bg-ui-bg-base">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Pagamento
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-payment-button"
            >
              Editar
            </button>
          </Text>
        )}
      </div>

      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && OPCOES.length > 0 && (
            <>
              {/* 3 FORMAS DIRETAS — PIX · Cartão · Boleto (sem sub-menu) */}
              <div className="grid gap-3" data-testid="payment-options">
                {OPCOES.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => {
                      setError(null)
                      setOpcao(o.key)
                    }}
                    className={clx(
                      "flex items-center justify-between rounded-lg border p-4 text-left transition-colors",
                      {
                        "border-copamar-primary ring-2 ring-copamar-primary/30 bg-copamar-bg-light dark:bg-ui-bg-subtle":
                          opcao === o.key,
                        "border-ui-border-base hover:border-ui-border-interactive":
                          opcao !== o.key,
                      }
                    )}
                    data-testid={`payment-opcao-${o.key}`}
                  >
                    <span className="flex flex-col">
                      <span className="text-base font-medium text-ui-fg-base">
                        {o.titulo}
                      </span>
                      <span className="text-sm text-ui-fg-subtle">{o.sub}</span>
                    </span>
                    <span
                      className={clx(
                        "ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                        {
                          "border-copamar-primary": opcao === o.key,
                          "border-ui-border-base": opcao !== o.key,
                        }
                      )}
                    >
                      {opcao === o.key && (
                        <span className="h-2.5 w-2.5 rounded-full bg-copamar-primary" />
                      )}
                    </span>
                  </button>
                ))}
              </div>

              <ErrorMessage
                error={error}
                data-testid="payment-method-error-message"
              />

              {/* painel da forma escolhida — conduz até a confirmação sozinho */}
              {opcao === "pix" && (
                <div className="mt-6">
                  <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    ✅ 5% de desconto no PIX aplicado no total
                  </p>
                  <PagBankPix cartId={cart.id} fiscalDoc={fiscalDoc} />
                </div>
              )}
              {opcao === "card" && (
                <div className="mt-6">
                  <PagBankCard
                    cartId={cart.id}
                    fiscalDoc={fiscalDoc}
                    defaultHolder={defaultHolder}
                  />
                </div>
              )}
              {opcao === "boleto" && (
                <div className="mt-6">
                  <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    ✅ 5% de desconto no boleto aplicado no total
                  </p>
                  <PagHiperBoleto cartId={cart.id} fiscalDoc={fiscalDoc} />
                </div>
              )}
              {opcao === "loja" && <PagarNaLoja cart={cart} />}
            </>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Forma de pagamento
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Vale-presente
              </Text>
            </div>
          )}
        </div>

        {/* resumo colapsado */}
        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex items-start gap-x-1 w-full">
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Forma de pagamento
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method-summary"
                >
                  {tituloDe(opcao) ||
                    paymentInfoMap[activeSession?.provider_id]?.title ||
                    activeSession?.provider_id}
                </Text>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Forma de pagamento
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Vale-presente
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
