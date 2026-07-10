"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

/**
 * Dropdown compacto de ordenação (Marco 16/06): substitui a lista de rádios
 * "largada" no topo da loja por um botão "Ordenar: X ▾" que ABRE as opções ao
 * clicar — fica ao lado do título. Atualiza o ?sortBy na URL (igual ao
 * RefinementList, que segue em categorias/coleções). Fecha ao clicar fora/Esc.
 */
const OPCOES: { value: SortOptions; label: string }[] = [
  // "Mais vendidos" (default da loja): curadoria via metadata.destaque +
  // boost Tena→demais→infantil — ver sortProducts.
  { value: "destaque", label: "Mais vendidos" },
  { value: "created_at", label: "Mais recentes" },
  { value: "price_asc", label: "Preço: menor → maior" },
  { value: "price_desc", label: "Preço: maior → menor" },
]

export default function SortDropdown({ sortBy }: { sortBy: SortOptions }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const atual = OPCOES.find((o) => o.value === sortBy) ?? OPCOES[0]

  const selecionar = (value: SortOptions) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sortBy", value)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
    setAberto(false)
  }

  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false)
    }
    document.addEventListener("mousedown", fora)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("mousedown", fora)
      document.removeEventListener("keydown", esc)
    }
  }, [aberto])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        data-testid="sort-by-container"
        className="flex items-center gap-2 rounded-lg border border-ui-border-base bg-ui-bg-base px-3.5 py-2 text-sm text-ui-fg-base shadow-sm transition hover:border-copamar-primary/60"
      >
        <span className="text-ui-fg-subtle">Ordenar:</span>
        <span className="font-semibold">{atual.label}</span>
        <span
          className={`text-ui-fg-subtle transition-transform ${aberto ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {aberto && (
        <div
          role="listbox"
          className="absolute right-0 z-20 mt-1.5 w-60 overflow-hidden rounded-xl border border-ui-border-base bg-ui-bg-base py-1 shadow-xl"
        >
          {OPCOES.map((o) => {
            const ativo = o.value === sortBy
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={ativo}
                onClick={() => selecionar(o.value)}
                className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition hover:bg-ui-bg-subtle ${
                  ativo ? "font-semibold text-copamar-primary" : "text-ui-fg-base"
                }`}
              >
                {o.label}
                {ativo && <span aria-hidden>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
