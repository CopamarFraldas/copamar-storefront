"use client"

import { useEffect, useState } from "react"

/**
 * Filtros da LOJA (/store) na sidebar — Marca, Tamanho e "Para quem" em LISTA
 * VERTICAL com acordeão (collapse) por grupo, multi-seleção via checkbox
 * (Marco 11/06). Técnica: o grid carrega TODOS os produtos com data-attributes
 * e o filtro esconde os <li> que não casam — instantâneo, sem roundtrip.
 * Regra: OR dentro do grupo, AND entre grupos (padrão e-commerce).
 */
const ORDEM_TAM = ["RN", "P", "P/M", "M", "G", "G/EG", "EG", "XG", "XXG"]
const ORDEM_GEN = ["Unissex", "Masculino", "Feminino", "Infantil"]

type Opcao = { valor: string; qtd: number }

const FiltrosLoja = ({ gridId }: { gridId: string }) => {
  const [tipos, setTipos] = useState<Opcao[]>([])
  const [marcas, setMarcas] = useState<Opcao[]>([])
  const [tamanhos, setTamanhos] = useState<Opcao[]>([])
  const [generos, setGeneros] = useState<Opcao[]>([])
  const [selTipo, setSelTipo] = useState<Set<string>>(new Set())
  const [selMarca, setSelMarca] = useState<Set<string>>(new Set())
  const [selTam, setSelTam] = useState<Set<string>>(new Set())
  const [selGen, setSelGen] = useState<Set<string>>(new Set())
  const [aberto, setAberto] = useState<Record<string, boolean>>({
    "Tipo de produto": true,
    Marca: true,
    Tamanho: true,
    "Para quem": true,
  })
  const [mostrando, setMostrando] = useState(0)
  const [total, setTotal] = useState(0)

  // descobre opções + contagens no grid (retry — o grid chega via Suspense)
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
      const conta = (attr: string) => {
        const m = new Map<string, number>()
        lis.forEach((li) => {
          const v = li.getAttribute(attr)
          if (v) m.set(v, (m.get(v) || 0) + 1)
        })
        return m
      }
      const tp = conta("data-tipo")
      const m = conta("data-marca")
      const t = conta("data-tamanho")
      const g = conta("data-genero")
      setTipos(
        Array.from(tp, ([valor, qtd]) => ({ valor, qtd })).sort((a, b) =>
          a.valor === "Outros" ? 1 : b.valor === "Outros" ? -1 : b.qtd - a.qtd
        )
      )
      setMarcas(
        Array.from(m, ([valor, qtd]) => ({ valor, qtd })).sort((a, b) =>
          a.valor === "Outras" ? 1 : b.valor === "Outras" ? -1 : b.qtd - a.qtd
        )
      )
      setTamanhos(
        Array.from(t, ([valor, qtd]) => ({ valor, qtd })).sort(
          (a, b) => ORDEM_TAM.indexOf(a.valor) - ORDEM_TAM.indexOf(b.valor)
        )
      )
      setGeneros(
        Array.from(g, ([valor, qtd]) => ({ valor, qtd })).sort(
          (a, b) => ORDEM_GEN.indexOf(a.valor) - ORDEM_GEN.indexOf(b.valor)
        )
      )
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
      const ok =
        (selTipo.size === 0 || selTipo.has(li.getAttribute("data-tipo") || "")) &&
        (selMarca.size === 0 || selMarca.has(li.getAttribute("data-marca") || "")) &&
        (selTam.size === 0 || selTam.has(li.getAttribute("data-tamanho") || "")) &&
        (selGen.size === 0 || selGen.has(li.getAttribute("data-genero") || ""))
      li.style.display = ok ? "" : "none"
      if (ok) vis++
    })
    setMostrando(vis)
  }, [selTipo, selMarca, selTam, selGen, gridId])

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, v: string) => {
    const n = new Set(set)
    n.has(v) ? n.delete(v) : n.add(v)
    setter(n)
  }

  const temFiltro = selTipo.size + selMarca.size + selTam.size + selGen.size > 0

  const Grupo = ({
    titulo,
    opcoes,
    sel,
    setter,
  }: {
    titulo: string
    opcoes: Opcao[]
    sel: Set<string>
    setter: (s: Set<string>) => void
  }) => {
    if (opcoes.length < 2) return null
    const estaAberto = aberto[titulo] !== false
    return (
      <div className="border-b border-ui-border-base pb-3">
        {/* collapse bar */}
        <button
          type="button"
          onClick={() => setAberto((a) => ({ ...a, [titulo]: !estaAberto }))}
          aria-expanded={estaAberto}
          className="flex w-full items-center justify-between py-2 text-left"
        >
          <span className="text-sm font-semibold text-ui-fg-base">
            {titulo}
            {sel.size > 0 && (
              <span className="ml-2 rounded-full bg-copamar-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                {sel.size}
              </span>
            )}
          </span>
          <span
            className={`text-ui-fg-subtle transition-transform ${estaAberto ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▾
          </span>
        </button>
        {estaAberto && (
          <ul className="mt-1 flex flex-col gap-0.5">
            {opcoes.map((o) => {
              const ativo = sel.has(o.valor)
              return (
                <li key={o.valor}>
                  <button
                    type="button"
                    onClick={() => toggle(sel, setter, o.valor)}
                    aria-pressed={ativo}
                    className="group flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left text-sm hover:bg-ui-bg-subtle"
                  >
                    <span
                      className={
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold text-white transition " +
                        (ativo
                          ? "border-copamar-primary bg-copamar-primary"
                          : "border-ui-border-strong bg-white group-hover:border-copamar-primary/60")
                      }
                      aria-hidden
                    >
                      {ativo ? "✓" : ""}
                    </span>
                    <span className={ativo ? "font-medium text-ui-fg-base" : "text-ui-fg-base"}>
                      {o.valor}
                    </span>
                    <span className="ml-auto text-xs text-ui-fg-muted">{o.qtd}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-ui-fg-subtle">Filtrar</p>
      <Grupo titulo="Tipo de produto" opcoes={tipos} sel={selTipo} setter={setSelTipo} />
      <Grupo titulo="Marca" opcoes={marcas} sel={selMarca} setter={setSelMarca} />
      <Grupo titulo="Tamanho" opcoes={tamanhos} sel={selTam} setter={setSelTam} />
      <Grupo titulo="Para quem" opcoes={generos} sel={selGen} setter={setSelGen} />
      {temFiltro && (
        <p className="mt-2 text-xs text-ui-fg-subtle">
          {mostrando} de {total} produtos ·{" "}
          <button
            type="button"
            onClick={() => {
              setSelTipo(new Set())
              setSelMarca(new Set())
              setSelTam(new Set())
              setSelGen(new Set())
            }}
            className="font-semibold text-copamar-primary underline"
          >
            limpar
          </button>
        </p>
      )}
    </div>
  )
}

export default FiltrosLoja
