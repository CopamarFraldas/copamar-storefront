"use client"

import { useEffect, useState } from "react"

/**
 * Filtros rápidos (nº5) — agora 100% no TAMANHO via metadata.tamanho (gravado na
 * normalização) e por texto no tipo/absorção/gênero. Filtra CLIENT-SIDE os cards
 * do grid (id=gridId) escondendo os <li> que não casam — instantâneo e preciso,
 * sem depender de filtro por metadata na API (que o store API não suporta).
 *
 * O grid renderiza cada item como <li data-tamanho data-titulo> e carrega um
 * limite alto (a busca/categoria têm poucos itens), então o filtro cobre tudo.
 */
const ORDEM = ["P", "P/M", "M", "G", "G/EG", "EG", "XG", "XXG", "RN"]
const TIPOS = ["Fralda", "Pants", "Absorvente", "Protetor", "Noturna", "Masculino", "Feminino"]

const FiltrosBusca = ({ gridId }: { gridId: string }) => {
  const [tamanhos, setTamanhos] = useState<string[]>([])
  const [selTam, setSelTam] = useState<Set<string>>(new Set())
  const [selTipo, setSelTipo] = useState<Set<string>>(new Set())
  const [mostrando, setMostrando] = useState(0)

  // lê os tamanhos presentes no grid (só mostra chips de tamanho que existem)
  useEffect(() => {
    const grid = document.getElementById(gridId)
    if (!grid) return
    const lis = Array.from(grid.querySelectorAll<HTMLElement>("li[data-titulo]"))
    const tam = new Set<string>()
    lis.forEach((li) => {
      const t = li.getAttribute("data-tamanho")
      if (t) tam.add(t)
    })
    setTamanhos(Array.from(tam).sort((a, b) => ORDEM.indexOf(a) - ORDEM.indexOf(b)))
    setMostrando(lis.length)
  }, [gridId])

  // aplica o filtro escondendo os <li> que não casam
  useEffect(() => {
    const grid = document.getElementById(gridId)
    if (!grid) return
    const lis = Array.from(grid.querySelectorAll<HTMLElement>("li[data-titulo]"))
    let vis = 0
    lis.forEach((li) => {
      const tam = li.getAttribute("data-tamanho") || ""
      const titulo = (li.getAttribute("data-titulo") || "").toLowerCase()
      const okTam = selTam.size === 0 || selTam.has(tam)
      const okTipo =
        selTipo.size === 0 ||
        Array.from(selTipo).every((tp) => titulo.includes(tp.toLowerCase()))
      const ok = okTam && okTipo
      li.style.display = ok ? "" : "none"
      if (ok) vis++
    })
    setMostrando(vis)
  }, [selTam, selTipo, gridId])

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, v: string) => {
    const n = new Set(set)
    n.has(v) ? n.delete(v) : n.add(v)
    setter(n)
  }

  const temFiltro = selTam.size > 0 || selTipo.size > 0
  const chip = (ativo: boolean) =>
    "rounded-full border px-3 py-1 text-sm transition " +
    (ativo
      ? "border-copamar-primary bg-copamar-primary text-white"
      : "border-ui-border-base bg-ui-bg-subtle text-ui-fg-base hover:border-copamar-primary/60")

  return (
    <div className="mb-6 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-ui-fg-subtle">
          Tipo
        </span>
        {TIPOS.map((t) => (
          <button key={t} type="button" onClick={() => toggle(selTipo, setSelTipo, t)} aria-pressed={selTipo.has(t)} className={chip(selTipo.has(t))}>
            {t}
          </button>
        ))}
      </div>
      {tamanhos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-ui-fg-subtle">
            Tamanho
          </span>
          {tamanhos.map((t) => (
            <button key={t} type="button" onClick={() => toggle(selTam, setSelTam, t)} aria-pressed={selTam.has(t)} className={chip(selTam.has(t))}>
              {t}
            </button>
          ))}
        </div>
      )}
      {temFiltro && (
        <p className="text-xs text-ui-fg-subtle">
          {mostrando} {mostrando === 1 ? "produto" : "produtos"} ·{" "}
          <button
            type="button"
            onClick={() => {
              setSelTam(new Set())
              setSelTipo(new Set())
            }}
            className="font-semibold text-copamar-primary underline"
          >
            limpar filtros
          </button>
        </p>
      )}
    </div>
  )
}

export default FiltrosBusca
