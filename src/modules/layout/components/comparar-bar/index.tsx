"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  CompararItem,
  lerComparar,
  limparComparar,
  removerComparar,
  subscribeComparar,
} from "@lib/util/comparar"

/**
 * Barra fixa de baixo do comparador — aparece quando há produto marcado nos
 * cards (⚖ Comparar). Miniaturas com X pra remover + CTA "Comparar (N) →"
 * (habilita com 2+). Montada no layout (main); some no carrinho/checkout
 * (pra não brigar com a mobile-checkout-bar, z-[110]) e na própria /comparar.
 */
export default function CompararBar() {
  const [itens, setItens] = useState<CompararItem[]>([])
  const pathname = usePathname()

  useEffect(() => {
    const sync = () => setItens(lerComparar())
    sync()
    return subscribeComparar(sync)
  }, [])

  const oculto = /\/(cart|carrinho|checkout|comparar)(\/|$)/.test(
    pathname || ""
  )
  if (oculto || itens.length === 0) return null

  const pronto = itens.length >= 2
  const href = `/comparar?p=${itens.map((i) => i.handle).join(",")}`

  // z-[80]: acima do chat da MAPA (z-[60], que flutua a 84px do rodapé, logo
  // ACIMA desta barra) e ABAIXO do modal de cookies (z-[90]) e da
  // mobile-checkout-bar (z-[110]) — mesma escada de camadas do mapa-chat
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-ui-border-base bg-ui-bg-base px-4 pt-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="region"
      aria-label="Produtos selecionados para comparar"
      data-testid="comparar-bar"
    >
      <div className="content-container flex items-center gap-x-3">
        {/* miniaturas + X */}
        <ul className="flex min-w-0 flex-1 items-center gap-x-2 overflow-x-auto">
          {itens.map((item) => (
            <li
              key={item.handle}
              className="relative shrink-0 rounded-md border border-ui-border-base bg-white p-0.5"
              title={item.title}
            >
              {item.thumbnail ? (
                <Image
                  src={item.thumbnail}
                  alt={item.title}
                  width={44}
                  height={44}
                  className="h-11 w-11 object-contain"
                />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center text-lg text-ui-fg-muted">
                  ?
                </span>
              )}
              <button
                type="button"
                onClick={() => removerComparar(item.handle)}
                aria-label={`Remover ${item.title} da comparação`}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-ui-border-base bg-ui-bg-base text-[11px] leading-none text-ui-fg-subtle shadow-sm transition-colors hover:text-ui-fg-base"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        {!pronto && (
          <span className="hidden text-xs text-ui-fg-subtle small:block">
            Marque mais 1 produto para comparar
          </span>
        )}

        <button
          type="button"
          onClick={limparComparar}
          className="shrink-0 text-xs text-ui-fg-subtle underline underline-offset-2 transition-colors hover:text-ui-fg-base"
        >
          Limpar
        </button>

        {pronto ? (
          <LocalizedClientLink
            href={href}
            className="shrink-0 rounded-large bg-copamar-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-copamar-primary-dark"
            data-testid="comparar-cta"
          >
            Comparar ({itens.length}) →
          </LocalizedClientLink>
        ) : (
          <span
            className="shrink-0 cursor-not-allowed rounded-large bg-ui-bg-disabled px-4 py-2.5 text-sm font-semibold text-ui-fg-disabled"
            aria-disabled="true"
          >
            Comparar ({itens.length})
          </span>
        )}
      </div>
    </div>
  )
}
