"use client"

import { useEffect, useMemo, useState } from "react"

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

type Item = { tipo: string; marca: string; tamanho: string; genero: string }

const FiltrosLoja = ({ gridId }: { gridId: string }) => {
  const [itens, setItens] = useState<Item[]>([])
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
  // mobile: gaveta lateral (aba fixa no canto esquerdo abre/fecha — Marco 11/06)
  const [gaveta, setGaveta] = useState(false)

  // trava o scroll da página enquanto a gaveta está aberta
  useEffect(() => {
    if (gaveta) {
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [gaveta])

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
      setItens(
        lis.map((li) => ({
          tipo: li.getAttribute("data-tipo") || "",
          marca: li.getAttribute("data-marca") || "",
          tamanho: li.getAttribute("data-tamanho") || "",
          genero: li.getAttribute("data-genero") || "",
        }))
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

  // FACETS dinâmicos (Marco 11/06): a contagem de cada opção considera os
  // filtros dos OUTROS grupos (não o próprio — preserva o OR interno). Opção
  // que zera some da lista (a menos que esteja selecionada). A ORDEM é fixa
  // (pela contagem total) pra lista não "dançar" a cada clique.
  const sels: Record<keyof Item, Set<string>> = {
    tipo: selTipo,
    marca: selMarca,
    tamanho: selTam,
    genero: selGen,
  }
  const { tipos, marcas, tamanhos, generos } = useMemo(() => {
    const casaExceto = (i: Item, exceto: keyof Item) =>
      (Object.keys(sels) as (keyof Item)[]).every(
        (k) => k === exceto || sels[k].size === 0 || sels[k].has(i[k])
      )
    const facet = (campo: keyof Item, ordem?: string[], ultimo?: string): Opcao[] => {
      const totalPor = new Map<string, number>()
      itens.forEach((i) => i[campo] && totalPor.set(i[campo], (totalPor.get(i[campo]) || 0) + 1))
      const dinamico = new Map<string, number>()
      itens.forEach((i) => {
        if (i[campo] && casaExceto(i, campo))
          dinamico.set(i[campo], (dinamico.get(i[campo]) || 0) + 1)
      })
      return Array.from(totalPor.keys())
        .sort((a, b) =>
          ordem
            ? ordem.indexOf(a) - ordem.indexOf(b)
            : a === ultimo ? 1 : b === ultimo ? -1 : (totalPor.get(b) || 0) - (totalPor.get(a) || 0)
        )
        .map((valor) => ({ valor, qtd: dinamico.get(valor) || 0 }))
        .filter((o) => o.qtd > 0 || sels[campo].has(o.valor))
    }
    return {
      tipos: facet("tipo", undefined, "Outros"),
      marcas: facet("marca", undefined, "Outras"),
      tamanhos: facet("tamanho", ORDEM_TAM),
      generos: facet("genero", ORDEM_GEN),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itens, selTipo, selMarca, selTam, selGen])

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

  const nSel = selTipo.size + selMarca.size + selTam.size + selGen.size

  const corpo = (
    <div className="flex flex-col gap-1">
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

  return (
    <>
      {/* DESKTOP: inline na sidebar */}
      <div className="hidden small:flex small:flex-col small:gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-ui-fg-subtle">Filtrar</p>
        {corpo}
      </div>

      {/* MOBILE: aba fixa no canto esquerdo → gaveta deslizante */}
      <div className="small:hidden">
        {!gaveta && (
          <button
            type="button"
            onClick={() => setGaveta(true)}
            aria-label="Abrir filtros"
            className="fixed left-0 top-1/3 z-30 flex items-center gap-1 rounded-r-xl bg-copamar-primary py-3 pl-2 pr-2.5 text-sm font-bold text-white shadow-lg active:scale-95"
          >
            <span aria-hidden>▸</span> Filtrar
            {nSel > 0 && (
              <span className="rounded-full bg-white px-1.5 text-[11px] font-bold text-copamar-primary">
                {nSel}
              </span>
            )}
          </button>
        )}
        {gaveta && (
          <>
            {/* fundo escurecido — tocar fora também fecha */}
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setGaveta(false)}
              aria-hidden
            />
            <div className="fixed left-0 top-0 z-50 flex h-full w-[84%] max-w-[330px] flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-ui-border-base px-4 py-3">
                <span className="text-sm font-bold uppercase tracking-wide text-ui-fg-base">
                  Filtrar
                  {nSel > 0 && (
                    <span className="ml-2 rounded-full bg-copamar-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {nSel}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setGaveta(false)}
                  aria-label="Fechar filtros"
                  className="rounded-lg bg-ui-bg-subtle px-3 py-1.5 text-base font-bold text-ui-fg-base active:scale-95"
                >
                  ◂
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">{corpo}</div>
              <div className="border-t border-ui-border-base px-4 py-3">
                <button
                  type="button"
                  onClick={() => setGaveta(false)}
                  className="w-full rounded-xl bg-copamar-primary py-3 text-sm font-bold text-white active:scale-[0.99]"
                >
                  Ver {mostrando} produto{mostrando === 1 ? "" : "s"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default FiltrosLoja
