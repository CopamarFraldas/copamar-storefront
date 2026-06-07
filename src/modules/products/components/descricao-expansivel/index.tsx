"use client"

import { useState } from "react"

/**
 * Descrição COLAPSADA no mobile (Marco 07/06, padrão Tena/Amazon): a PDP
 * mobile mostra imagens → tamanhos → comprar → CEP primeiro; a descrição
 * completa fica clampada com "Ver descrição completa" pra não comer espaço.
 * No desktop (small:) renderiza sempre aberta — comportamento intocado.
 */
export default function DescricaoExpansivel({
  children,
}: {
  children: React.ReactNode
}) {
  const [aberto, setAberto] = useState(false)

  return (
    <div>
      <div
        className={
          aberto
            ? "relative"
            : "relative max-h-44 overflow-hidden small:max-h-none"
        }
      >
        {children}
        {!aberto && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ui-bg-base to-transparent small:hidden"
            aria-hidden
          />
        )}
      </div>
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-ui-border-base py-2 text-sm font-medium text-copamar-primary small:hidden"
      >
        {aberto ? "Ver menos ▴" : "Ver descrição completa ▾"}
      </button>
    </div>
  )
}
