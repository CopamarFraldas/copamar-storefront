"use client"

import { signupAndSetAddress } from "@lib/data/customer"
import compareAddresses from "@lib/util/compare-addresses"
import { CheckCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text, useToggleState } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import Spinner from "@modules/common/icons/spinner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState, useRef, useState } from "react"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import IdentificacaoFiscal from "../identificacao-fiscal"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useActionState(signupAndSetAddress, null)

  // Pop-up de confirmação de telefone com 10 dígitos (Marco jul/26): ao
  // "Continuar para entrega", se o telefone de ENTREGA (país BR) tiver 10 díg
  // (fixo, ou celular sem o 9), confirma com o cliente antes de seguir — NÃO
  // bloqueia (10 díg é válido), só pergunta "é isso mesmo?". Verde segue,
  // vermelho volta pro campo. 11 díg passa direto; inválido cai no required.
  const formRef = useRef<HTMLFormElement>(null)
  const confirmado10Ref = useRef(false)
  const [aviso10, setAviso10] = useState(false)

  const onSubmitEndereco = (e: React.FormEvent<HTMLFormElement>) => {
    if (confirmado10Ref.current) {
      confirmado10Ref.current = false
      return // já confirmado no pop-up → deixa enviar
    }
    const fd = new FormData(e.currentTarget)
    const pais = String(
      fd.get("shipping_address.country_code") || "br"
    ).toLowerCase()
    let d = String(fd.get("shipping_address.phone") || "").replace(/\D/g, "")
    if (d.length > 11 && d.startsWith("55")) d = d.slice(2)
    if (pais === "br" && d.length === 10) {
      e.preventDefault()
      setAviso10(true)
    }
  }

  const continuar10 = () => {
    setAviso10(false)
    confirmado10Ref.current = true
    formRef.current?.requestSubmit()
  }
  const arrumar10 = () => {
    setAviso10(false)
    document
      .querySelector<HTMLInputElement>('[data-testid="shipping-phone-input"]')
      ?.focus()
  }

  return (
    <div className="bg-ui-bg-base">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular gap-x-2 items-baseline"
        >
          Endereço de Entrega
          {!isOpen && <CheckCircleSolid />}
        </Heading>
        {!isOpen && cart?.shipping_address && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-address-button"
            >
              Editar
            </button>
          </Text>
        )}
      </div>
      {isOpen ? (
        <form action={formAction} ref={formRef} onSubmit={onSubmitEndereco}>
          {/* same_as_billing via input NATIVO: o Checkbox visual é <button
              type="button"> e NÃO entra no FormData. Sem isto, o servidor recebia
              sempre null → endereço de cobrança ia vazio/errado (revisão 18/06). */}
          <input
            type="hidden"
            name="same_as_billing"
            value={sameAsBilling ? "on" : "off"}
          />
          <div className="pb-8">
            <ShippingAddress
              customer={customer}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
              // Ordem QDB (jul/26): CPF/CNPJ entre Sobrenome e Telefone. O bloco
              // continua dentro do MESMO <form> — os names do FormData não mudam.
              fiscalSlot={<IdentificacaoFiscal cart={cart} customer={customer} />}
            />

            {!sameAsBilling && (
              <div>
                <Heading
                  level="h2"
                  className="text-3xl-regular gap-x-4 pb-6 pt-8"
                >
                  Endereço de cobrança
                </Heading>

                <BillingAddress cart={cart} customer={customer} />
              </div>
            )}

            {/* Opt-in de marketing (#97) — DESMARCADO por padrão (LGPD) */}
            <label className="flex items-start gap-x-2 mt-6 text-small-regular text-ui-fg-subtle select-none cursor-pointer">
              <input
                type="checkbox"
                name="marketing_consent"
                defaultChecked={false}
                className="mt-0.5"
                data-testid="marketing-consent-checkbox"
              />
              <span>
                Quero receber ofertas e novidades da Copamar por e-mail e
                WhatsApp. (opcional)
              </span>
            </label>

            <SubmitButton className="mt-6" data-testid="submit-address-button">
              Continuar para entrega
            </SubmitButton>
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>

          {/* Pop-up: telefone com 10 dígitos → confirma antes de seguir */}
          {aviso10 && (
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Confirmação de telefone"
            >
              <div className="w-full max-w-sm rounded-2xl bg-ui-bg-base p-6 shadow-2xl">
                <p className="text-lg font-semibold text-ui-fg-base">
                  Confirme seu telefone 📱
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ui-fg-subtle">
                  O número que você digitou tem{" "}
                  <strong className="text-ui-fg-base">10 dígitos</strong>. Celular
                  costuma ter <strong className="text-ui-fg-base">11</strong> (com
                  o 9 na frente). O entregador liga e manda WhatsApp — está certo
                  assim?
                </p>
                <div className="mt-5 flex flex-col gap-2 small:flex-row-reverse">
                  <button
                    type="button"
                    onClick={continuar10}
                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    data-testid="tel-10-continuar"
                  >
                    Sim, continuar
                  </button>
                  <button
                    type="button"
                    onClick={arrumar10}
                    className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                    data-testid="tel-10-arrumar"
                  >
                    Arrumar o número
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && cart.shipping_address ? (
              <div className="flex items-start gap-x-8">
                <div className="flex items-start gap-x-1 w-full">
                  <div
                    className="flex flex-col w-1/3"
                    data-testid="shipping-address-summary"
                  >
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      Endereço de Entrega
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.first_name}{" "}
                      {cart.shipping_address.last_name}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.address_1}{" "}
                      {cart.shipping_address.address_2}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.postal_code},{" "}
                      {cart.shipping_address.city}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.country_code?.toUpperCase()}
                    </Text>
                  </div>

                  <div
                    className="flex flex-col w-1/3 "
                    data-testid="shipping-contact-summary"
                  >
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      Contato
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.phone}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.email}
                    </Text>
                  </div>

                  <div
                    className="flex flex-col w-1/3"
                    data-testid="billing-address-summary"
                  >
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      Endereço de Cobrança
                    </Text>

                    {sameAsBilling ? (
                      <Text className="txt-medium text-ui-fg-subtle">
                        Endereço de cobrança igual ao de entrega
                      </Text>
                    ) : (
                      <>
                        <Text className="txt-medium text-ui-fg-subtle">
                          {cart.billing_address?.first_name}{" "}
                          {cart.billing_address?.last_name}
                        </Text>
                        <Text className="txt-medium text-ui-fg-subtle">
                          {cart.billing_address?.address_1}{" "}
                          {cart.billing_address?.address_2}
                        </Text>
                        <Text className="txt-medium text-ui-fg-subtle">
                          {cart.billing_address?.postal_code},{" "}
                          {cart.billing_address?.city}
                        </Text>
                        <Text className="txt-medium text-ui-fg-subtle">
                          {cart.billing_address?.country_code?.toUpperCase()}
                        </Text>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <Spinner />
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Addresses
