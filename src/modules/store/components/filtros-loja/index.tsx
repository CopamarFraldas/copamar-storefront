"use client"

import { useEffect, useState } from "react"

/**
 * Filtros da LOJA (/store) na sidebar — Marca, Tamanho e Gênero, multi-seleção
 * (Marco 11/06). Mesma técnica do FiltrosBusca: o grid carrega TODOS os
 * produtos com data-attributes (data-marca/data-tamanho/data-genero) e os
 * chips escondem os <li> que não casam — instantâneo, sem roundtrip.
 * Regra: OR dentro do grupo, AND entre grupos (padrão e-commerce).
 */
const ORDEM_TAM = ["RN", "P", "P/M", "M", "G", "G/EG", "EG", "XG", "XXG"]
const ORDEM_GEN = ["Unissex", "Masculino", "Feminino", "Infantil"]

const FiltrosLoja = ({ gridId }: { gridId: string }) => {
  const [marcas, setMarcas] = useState<string[]>([])
  const [tamanhos, setTamanhos] = useState<string[]>([])
  const [generos, setGeneros] = useState<string[]>([])
  const [selMarca, setSelMarca] = useState<Set<string>>(new Set())
  const [selTam, setSelTam] = useState<Set<string>>(new Set())
  const [selGen, setSelGen] = useState<Set<string>>(new Set())
  const [mostrando, setMostrando] = useState(0)
  const [total, setTotal] = useState(0)

  // descobre as opções existentes no grid (com retry — o grid chega via Suspense)
  useEffect(() => {
    let cancel = false
    let tries = 0
    const ler = () => {
      if (cancel) return
      const grid = document.getElementById(gridId)
      const lis = grid ? Array.from(grid.querySelectorAll<HTMLElement>("li[data-titulo]")) : []
      if (lis.length === 0 && tries < 30) {
        tries++
        setTimeout(ler, 150)
        return
      }
      const m = new Set<string>(), t = new Set<string>(), g = new Set<string>()
      lis.forEach((li) => {
        const ma = li.getAttribute("data-marca")
        const ta = li.getAttribute("data-tamanho")
        const ge = li.getAttribute("data-genero")
        if (ma) m.add(ma)
        if (ta) t.add(ta)
        if (ge) g.add(ge)
      })
      // marcas por ordem alfabética com "Outras" no fim
      const ms = Array.from(m).sort((a, b) =>
        a === "Outras" ? 1 : b === "Outras" ? -1 : a.localeCompare(b)
      )
      setMarcas(ms)
      setTamanhos(Array.from(t).sort((a, b) => ORDEM_TAM.indexOf(a) - ORDEM_TAM.indexOf(b)))
      setGeneros(Array.from(g).sort((a, b) => ORDEM_GEN.indexOf(a) - ORDEM_GEN.indexOf(b)))
      setMostrando(lis.length)
      setTotal(lis.length)
    }
    ler()
    return () => {
      cancel = true
    }
  }, [gridId])

  // aplica os filtros (OR no grupo, AND entre grupos)
  useEffect(() => {
    const grid = document.getElementById(gridId)
    if (!grid) return
    const lis = Array.from(grid.querySelectorAll<HTMLElement>("li[data-titulo]"))
    let vis = 0
    lis.forEach((li) => {
      const ma = li.getAttribute("data-marca") || ""
      const ta = li.getAttribute("data-tamanho") || ""
      const ge = li.getAttribute("data-genero") || ""
      const ok =
        (selMarca.size === 0 || selMarca.has(ma)) &&
        (selTam.size === 0 || selTam.has(ta)) &&
        (selGen.size === 0 || selGen.has(ge))
      li.style.display = ok ? "" : "none"
      if (ok) vis++
    })
    setMostrando(vis)
  }, [selMarca, selTam, selGen, gridId])

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, v: string) => {
    const n = new Set(set)
    n.has(v) ? n.delete(v) : n.add(v)
    setter(n)
  }

  const temFiltro = selMarca.size + selTam.size + selGen.size > 0
  const chip = (ativo: boolean) =>
    "rounded-full border px-3 py-1 text-sm transition " +
    (ativo
      ? "border-copamar-primary bg-copamar-primary text-white"
      : "border-ui-border-base bg-ui-bg-subtle text-ui-fg-base hover:border-copamar-primary/60")

  const Grupo = ({
    titulo,
    opcoes,
    sel,
    setter,
  }: {
    titulo: string
    opcoes: string[]
    sel: Set<string>
    setter: (s: Set<string>) => void
  }) =>
    opcoes.length > 1 ? (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-fg-subtle">
          {titulo}
        </p>
        <div className="flex flex-wrap gap-2">
          {opcoes.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => toggle(sel, setter, o)}
              aria-pressed={sel.has(o)}
              className={chip(sel.has(o))}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
    ) : null

  return (
    <div className="flex flex-col gap-6">
      <Grupo titulo="Marca" opcoes={marcas} sel={selMarca} setter={setSelMarca} />
      <Grupo titulo="Tamanho" opcoes={tamanhos} sel={selTam} setter={setSelTam} />
      <Grupo titulo="Para quem" opcoes={generos} sel={selGen} setter={setSelGen} />
      {temFiltro && (
        <p className="text-xs text-ui-fg-subtle">
          {mostrando} de {total} produtos ·{" "}
          <button
            type="button"
            onClick={() => {
              setSelMarca(new Set())
              setSelTam(new Set())
              setSelGen(new Set())
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

export default FiltrosLoja
