"use client"

import { useEffect, useState } from "react"
import { Button, clx } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { getCheckoutStep } from "@lib/util/get-checkout-step"

/**
 * Barra fixa no rodapé (só no MOBILE, < small) com o total + CTA "Finalizar
 * compra". Marco 04/06: NUNCA dois CTAs ao mesmo tempo — a barra observa o
 * botão do corpo (Summary, [data-testid="checkout-button"]) e só aparece
 * enquanto ele está FORA da tela; quando o cliente rola até o resumo, a barra
 * desliza pra fora. No desktop o resumo sticky resolve, então some (small:hidden).
 */
const MobileCheckoutBar = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  // o CTA do corpo está visível no viewport? (default false = barra visível,
  // já que o resumo fica bem abaixo do fold no mobile)
  const [corpoVisivel, setCorpoVisivel] = useState(false)

  useEffect(() => {
    const alvo = document.querySelector('[data-testid="checkout-button"]')
    if (!alvo || typeof IntersectionObserver === "undefined") return
    const obs = new IntersectionObserver(
      ([e]) => setCorpoVisivel(e.isIntersecting),
      { threshold: 0.4 }
    )
    obs.observe(alvo)
    return () => obs.disconnect()
  }, [])

  if (!cart?.region) return null
  const step = getCheckoutStep(cart)
  return (
    <div
      aria-hidden={corpoVisivel}
      className={clx(
        "small:hidden sticky bottom-0 inset-x-0 z-[110] bg-ui-bg-base border-t border-ui-border-base px-4 py-3 flex items-center justify-between gap-x-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]",
        "transition-all duration-200",
        corpoVisivel && "translate-y-full opacity-0 pointer-events-none"
      )}
    >
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
        tabIndex={corpoVisivel ? -1 : undefined}
      >
        <Button className="w-full h-11">Finalizar compra</Button>
      </LocalizedClientLink>
    </div>
  )
}

export default MobileCheckoutBar
