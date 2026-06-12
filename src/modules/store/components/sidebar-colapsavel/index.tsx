"use client"

import { useEffect, useState } from "react"

/**
 * Sidebar de filtros COLAPSÁVEL no desktop (Marco 11/06): botão "‹ Ocultar
 * filtros" recolhe a coluna inteira pra um botão fino encostado à esquerda
 * (com badge de filtros ativos) e o grid expande. Preferência lembrada
 * (localStorage). Os children ficam MONTADOS (hidden) pra não perder as
 * seleções. No mobile não interfere (a gaveta própria cuida).
 */
export default function SidebarColapsavel({ children }: { children: React.ReactNode }) {
  const [recolhida, setRecolhida] = useState(false)
  const [nSel, setNSel] = useState(0)

  // preferência persistida + badge via evento do FiltrosLoja
  useEffect(() => {
    setRecolhida(localStorage.getItem("loja_filtros_recolhida") === "1")
    const ouve = (e: Event) => setNSel((e as CustomEvent).detail || 0)
    window.addEventListener("filtros-loja:count", ouve)
    return () => window.removeEventListener("filtros-loja:count", ouve)
  }, [])

  const toggle = () =>
    setRecolhida((v) => {
      localStorage.setItem("loja_filtros_recolhida", v ? "0" : "1")
      return !v
    })

  return (
    <>
      {/* botão fino quando recolhida (só desktop) */}
      <div className={recolhida ? "hidden small:block" : "hidden"} data-testid="filtros-recolhidos">
        <button
          type="button"
          onClick={toggle}
          title="Mostrar filtros"
          className="sticky top-24 mr-4 mt-4 flex flex-col items-center gap-1.5 rounded-xl border border-ui-border-base bg-ui-bg-subtle px-2 py-4 text-ui-fg-subtle transition hover:border-copamar-primary/60 hover:text-copamar-primary"
        >
          <span aria-hidden>»</span>
          <span className="text-xs font-semibold" style={{ writingMode: "vertical-rl" }}>
            Filtros
          </span>
          {nSel > 0 && (
            <span className="rounded-full bg-copamar-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
              {nSel}
            </span>
          )}
        </button>
      </div>

      {/* coluna completa (montada sempre — esconder via CSS preserva seleção) */}
      <div className={recolhida ? "small:hidden" : ""}>
        <div className="small:sticky small:top-20 small:max-w-[280px] small:max-h-[calc(100vh-13rem)] small:overflow-y-auto small:overscroll-contain small:pr-1">
          <div className="hidden pt-4 small:ml-[1.675rem] small:block">
            <button
              type="button"
              onClick={toggle}
              className="text-xs font-semibold text-ui-fg-subtle transition hover:text-copamar-primary"
            >
              ‹ Ocultar filtros
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  )
}
