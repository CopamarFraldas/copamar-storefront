"use client"

import { Badge, Heading, Input, Label, Text } from "@medusajs/ui"
import React from "react"

import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Trash from "@modules/common/icons/trash"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  // Bloqueia alterar o cupom enquanto o PIX está em andamento (QR na tela). Mudar
  // o total nessa hora apaga a sessão de pagamento e o pedido não fecha (29/06).
  // O componente PIX liga/desliga o flag copamar_pix_qr_ativo (sessionStorage).
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

  const { promotions = [] } = cart

  // O resgate de cashback (CASHBK-*) NÃO é cupom: ele tem box próprio no
  // checkout com "desfazer" que estorna o débito no ledger. Aqui ele fica
  // INVISÍVEL (sem lixeira!) — remover o code por fora do /cashback/remover
  // deixaria o saldo reservado sem desconto correspondente (revisão 10/07).
  const temCashback = promotions.some((p) => p.code?.startsWith("CASHBK-"))
  // ASSINATURA5 (Entrega Programada, 10/07) também NÃO é cupom digitável: quem
  // aplica é o MOTOR, no carrinho do ciclo. Aparece na lista (o cliente PRECISA
  // ver os 5% prometidos no WhatsApp) mas SEM lixeira — tirar sem querer
  // mataria o benefício da entrega programada no meio do checkout.
  const temAssinatura = promotions.some((p) => p.code === "ASSINATURA5")
  const promotionsVisiveis = promotions.filter(
    (p) => !p.code?.startsWith("CASHBK-")
  )

  const removePromotionCode = async (code: string) => {
    if (pixLock) return
    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )

    await applyPromotions(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
  }

  const addPromotionCode = async (formData: FormData) => {
    if (pixLock) return
    setErrorMessage("")

    const code = formData.get("code")
    if (!code) {
      return
    }
    // ASSINATURA5 não é digitável: é o desconto automático da Entrega
    // Programada (o motor aplica no carrinho do ciclo). Digitado aqui, seria
    // 5% "de graça" fora do programa.
    if (code.toString().trim().toUpperCase() === "ASSINATURA5") {
      setErrorMessage(
        "Esse é o desconto automático da Entrega Programada — ele já vem aplicado no pedido do seu ciclo."
      )
      return
    }
    // NÃO-CUMULATIVO também com o cashback (mesma regra do backend): cupom
    // manual por cima do resgate acumularia os dois descontos.
    if (temCashback) {
      setErrorMessage(
        "Cupom não acumula com o cashback. Remova o cashback aplicado para usar o cupom."
      )
      return
    }
    // NÃO-CUMULATIVO com a Entrega Programada (regra do desenho 10/07): os 5%
    // da assinatura não somam com cupom manual.
    if (temAssinatura) {
      setErrorMessage(
        "Sua Entrega Programada já garante 5% de desconto — cupom não acumula."
      )
      return
    }
    const input = document.getElementById("promotion-input") as HTMLInputElement
    // NÃO-CUMULATIVO (Marco 03/07): cupom manual entra, PIX5 automático SAI —
    // cobre a ordem "PIX escolhido primeiro, cupom depois" (o setDescontoPix
    // cobre a inversa). Sem isso, ANIVER10 + PIX5 = 15% no PIX.
    const codes = promotions
      .filter((p) => p.code !== undefined && p.code !== "PIX5")
      .map((p) => p.code!)
    codes.push(code.toString())

    try {
      await applyPromotions(codes)
    } catch (e: any) {
      setErrorMessage(e.message)
    }

    if (input) {
      input.value = ""
    }
  }

  return (
    <div className="w-full bg-ui-bg-base flex flex-col">
      <div className="txt-medium">
        <form action={(a) => addPromotionCode(a)} className="w-full mb-5">
          <Label className="flex gap-x-1 my-2 items-center">
            {pixLock ? (
              <span className="txt-small text-ui-fg-muted flex items-center gap-1">
                🔒 Cupom travado durante o pagamento PIX
              </span>
            ) : (
              <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="txt-medium text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                data-testid="add-discount-button"
              >
                Adicionar cupom
              </button>
            )}

            {/* <Tooltip content="Você pode adicionar vários códigos de promoção">
              <InformationCircleSolid color="var(--fg-muted)" />
            </Tooltip> */}
          </Label>

          {isOpen && (
            <>
              <div className="flex w-full gap-x-2">
                <Input
                  className="size-full"
                  id="promotion-input"
                  name="code"
                  type="text"
                  autoFocus={false}
                  data-testid="discount-input"
                />
                <SubmitButton
                  variant="secondary"
                  data-testid="discount-apply-button"
                >
                  Aplicar
                </SubmitButton>
              </div>

              <ErrorMessage
                error={errorMessage}
                data-testid="discount-error-message"
              />
            </>
          )}
        </form>

        {promotionsVisiveis.length > 0 && (
          <div className="w-full flex items-center">
            <div className="flex flex-col w-full">
              <Heading className="txt-medium mb-2">
                Cupom(ns) aplicado(s):
              </Heading>

              {promotionsVisiveis.map((promotion) => {
                return (
                  <div
                    key={promotion.id}
                    className="flex items-center justify-between w-full max-w-full mb-2"
                    data-testid="discount-row"
                  >
                    <Text className="flex gap-x-1 items-baseline txt-small-plus w-4/5 pr-1">
                      <span className="truncate" data-testid="discount-code">
                        <Badge
                          color={promotion.is_automatic ? "green" : "grey"}
                          size="small"
                        >
                          {promotion.code}
                        </Badge>{" "}
                        (
                        {promotion.application_method?.value !== undefined &&
                          promotion.application_method.currency_code !==
                            undefined && (
                            <>
                              {promotion.application_method.type ===
                              "percentage"
                                ? `${promotion.application_method.value}%`
                                : convertToLocale({
                                    amount: +promotion.application_method.value,
                                    currency_code:
                                      promotion.application_method
                                        .currency_code,
                                  })}
                            </>
                          )}
                        )
                        {/* {promotion.is_automatic && (
                          <Tooltip content="Esta promoção é aplicada automaticamente">
                            <InformationCircleSolid className="inline text-zinc-400" />
                          </Tooltip>
                        )} */}
                      </span>
                    </Text>
                    {/* ASSINATURA5 = benefício do programa, não cupom: SEM
                        lixeira (padrão do fix do cashback) — remover aqui
                        tiraria os 5% prometidos no WhatsApp do ciclo */}
                    {!promotion.is_automatic &&
                      promotion.code !== "ASSINATURA5" && (
                        <button
                          className="flex items-center"
                          onClick={() => {
                            if (!promotion.code) {
                              return
                            }

                            removePromotionCode(promotion.code)
                          }}
                          data-testid="remove-discount-button"
                        >
                          <Trash size={14} />
                          <span className="sr-only">
                            Remover cupom do pedido
                          </span>
                        </button>
                      )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiscountCode
