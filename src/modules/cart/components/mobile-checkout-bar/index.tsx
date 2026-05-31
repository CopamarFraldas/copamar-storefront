"use client"

import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { getCheckoutStep } from "@lib/util/get-checkout-step"

/**
 * Barra fixa no rodapé (só no MOBILE, < small) com o total + CTA "Finalizar
 * compra" sempre visível — padrão de e-commerce grande, pra não precisar rolar
 * a lista de itens toda até achar o botão. No desktop o resumo sticky resolve,
 * então some (small:hidden).
 */
const MobileCheckoutBar = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  if (!cart?.region) return null
  const step = getCheckoutStep(cart)
  return (
    <div className="small:hidden sticky bottom-0 inset-x-0 z-[110] bg-ui-bg-base border-t border-ui-border-base px-4 py-3 flex items-center justify-between gap-x-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      <div className="flex flex-col leading-tight">
        <span className="text-xs text-ui-fg-subtle">Total</span>
        <span className="text-base font-semibold text-ui-fg-base">
          {convertToLocale({
            amount: cart?.total ?? 0,
            currency_code: cart?.currency_code,
          })}
        </span>
      </div>
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        className="flex-1 max-w-[62%]"
        data-testid="checkout-button-mobile"
      >
        <Button className="w-full h-11">Finalizar compra</Button>
      </LocalizedClientLink>
    </div>
  )
}

export default MobileCheckoutBar
