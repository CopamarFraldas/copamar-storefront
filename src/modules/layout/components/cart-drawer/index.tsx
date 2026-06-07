"use client"

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import FreeShippingBar from "@modules/cart/components/free-shipping-bar"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

/**
 * CARRINHO LATERAL (drawer) — Marco 07/06, inspirado no site da Tena:
 * adicionar um item abre um painel deslizante à direita com toast verde
 * "Item adicionado", itens, barra de frete grátis, subtotal e CTAs
 * (Finalizar compra / Escolher mais produtos). Substitui o dropdown de hover.
 * Fecha com ESC/overlay; mobile = largura cheia (max 420px).
 */
const CartDrawer = ({ cart: cartState }: { cart?: HttpTypes.StoreCart | null }) => {
  const [aberto, setAberto] = useState(false)
  const [toast, setToast] = useState(false)
  const pathname = usePathname()

  const totalItems =
    cartState?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
  const subtotal = cartState?.item_subtotal ?? cartState?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems || 0)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // adicionar item → abre o drawer + toast (fora da página do carrinho/checkout)
  useEffect(() => {
    if (
      itemRef.current !== totalItems &&
      totalItems > itemRef.current &&
      !pathname.includes("/cart") &&
      !pathname.includes("/checkout")
    ) {
      setAberto(true)
      setToast(true)
      if (toastTimer.current) clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setToast(false), 3000)
    }
    itemRef.current = totalItems
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems])

  // ESC fecha + GESTÃO DE FOCO (QA noturno): foco entra no painel ao abrir,
  // Tab fica preso dentro (trap), e volta pro gatilho ao fechar — obrigações
  // de um aria-modal de verdade
  const painelRef = useRef<HTMLElement | null>(null)
  const gatilhoRef = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    if (!aberto) return
    const anterior = document.activeElement as HTMLElement | null
    // foco inicial: botão fechar (1º focável do painel)
    setTimeout(() => {
      painelRef.current?.querySelector<HTMLElement>("button, a")?.focus()
    }, 50)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setAberto(false)
      if (e.key !== "Tab" || !painelRef.current) return
      const focaveis = painelRef.current.querySelectorAll<HTMLElement>(
        'button, a[href], input, [tabindex]:not([tabindex="-1"])'
      )
      if (!focaveis.length) return
      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primeiro.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      // devolve o foco pro gatilho (ou o que estava focado antes)
      ;(gatilhoRef.current ?? anterior)?.focus?.()
    }
  }, [aberto])

  // avisa o resto da UI (ex.: botão flutuante do WhatsApp) que o painel
  // abriu/fechou — o float desliza junto e volta com bounce (Marco 07/06)
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("copamar-drawer", { detail: { aberto } })
    )
    return () => {
      if (aberto) {
        window.dispatchEvent(
          new CustomEvent("copamar-drawer", { detail: { aberto: false } })
        )
      }
    }
  }, [aberto])

  const itens = (cartState?.items || [])
    .slice()
    .sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))

  return (
    <>
      {/* ícone 🛒 + badge — clique ABRE o drawer */}
      <button
        type="button"
        ref={gatilhoRef}
        onClick={() => setAberto(true)}
        className="flex h-full items-center gap-x-1.5 text-ui-fg-subtle hover:text-ui-fg-base"
        data-testid="nav-cart-link"
        aria-label={`Abrir carrinho com ${totalItems} ${totalItems === 1 ? "item" : "itens"}`}
      >
        <span className="relative">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {totalItems > 0 && (
            <span
              data-testid="nav-cart-count"
              className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-copamar-primary px-1 text-[11px] font-bold leading-none text-white"
            >
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </span>
        <span className="hidden small:inline">Carrinho</span>
      </button>

      {/* overlay + painel */}
      {aberto && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Carrinho">
          <div
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={() => setAberto(false)}
          />
          <aside
            ref={painelRef as any}
            className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-ui-bg-base shadow-2xl animate-in slide-in-from-right duration-200"
            data-testid="nav-cart-dropdown"
          >
            {/* topo */}
            <div className="flex items-center justify-between border-b border-ui-border-base px-4 py-3">
              <h3 className="text-base font-semibold text-ui-fg-base">
                Carrinho{totalItems > 0 ? ` (${totalItems})` : ""}
              </h3>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar carrinho"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ui-fg-subtle hover:bg-ui-bg-subtle hover:text-ui-fg-base"
              >
                ✕
              </button>
            </div>

            {/* toast item adicionado */}
            {toast && (
              <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300 animate-in fade-in duration-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                Item adicionado ao carrinho
              </div>
            )}

            {itens.length ? (
              <>
                {/* itens */}
                <div className="flex-1 overflow-y-auto px-4 py-3">
                  <ul className="flex flex-col gap-y-4">
                    {itens.map((item) => (
                      <li key={item.id} className="flex gap-x-3 border-b border-ui-border-base pb-4 last:border-b-0" data-testid="cart-item">
                        <LocalizedClientLink
                          href={`/products/${item.product_handle}`}
                          onClick={() => setAberto(false)}
                          className="w-20 shrink-0"
                        >
                          <Thumbnail
                            thumbnail={item.thumbnail}
                            images={item.variant?.product?.images}
                            title={item.product_title}
                            size="square"
                          />
                        </LocalizedClientLink>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <LocalizedClientLink
                            href={`/products/${item.product_handle}`}
                            onClick={() => setAberto(false)}
                            className="text-sm font-medium leading-snug text-ui-fg-base line-clamp-2"
                            data-testid="product-link"
                          >
                            {item.product_title}
                          </LocalizedClientLink>
                          <LineItemOptions
                            variant={item.variant}
                            productTitle={item.product_title}
                            data-testid="cart-item-variant"
                          />
                          <div className="mt-auto flex items-end justify-between pt-1">
                            <span className="text-xs text-ui-fg-subtle" data-testid="cart-item-quantity" data-value={item.quantity}>
                              {item.quantity}×
                            </span>
                            <div className="flex items-center gap-x-3">
                              <LineItemPrice item={item} style="tight" currencyCode={cartState!.currency_code} />
                              <DeleteButton id={item.id} data-testid="cart-item-remove-button" />
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* rodapé: barra frete grátis + subtotal + CTAs */}
                <div className="flex flex-col gap-y-3 border-t border-ui-border-base px-4 py-4">
                  <FreeShippingBar
                    subtotal={Number(subtotal) || 0}
                    currencyCode={cartState!.currency_code}
                    cepConhecido={cartState?.shipping_address?.postal_code}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ui-fg-base">
                      Subtotal <span className="text-ui-fg-subtle">(impostos inclusos)</span>
                    </span>
                    <span className="text-lg font-semibold text-ui-fg-base" data-testid="cart-subtotal" data-value={subtotal}>
                      {convertToLocale({ amount: Number(subtotal) || 0, currency_code: cartState!.currency_code })}
                    </span>
                  </div>
                  <LocalizedClientLink href="/checkout?step=address" passHref onClick={() => setAberto(false)}>
                    <Button className="w-full" size="large" data-testid="go-to-cart-button">
                      Finalizar compra
                    </Button>
                  </LocalizedClientLink>
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => setAberto(false)}
                      className="text-copamar-primary underline-offset-2 hover:underline"
                    >
                      ← Escolher mais produtos
                    </button>
                    <LocalizedClientLink
                      href="/cart"
                      onClick={() => setAberto(false)}
                      className="text-ui-fg-subtle underline-offset-2 hover:text-ui-fg-base hover:underline"
                    >
                      Ver carrinho completo
                    </LocalizedClientLink>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-y-4 px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ui-bg-subtle text-lg">
                  🛒
                </div>
                <p className="text-sm text-ui-fg-subtle">Seu carrinho está vazio.</p>
                <LocalizedClientLink href="/store" onClick={() => setAberto(false)}>
                  <Button variant="secondary">Explorar produtos</Button>
                </LocalizedClientLink>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  )
}

export default CartDrawer
