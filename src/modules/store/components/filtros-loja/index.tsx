"use client"

import { useEffect, useMemo, useState } from "react"

/**
 * Filtros da LOJA (/store) na sidebar — Tipo, Marca, Tamanho, "Para quem",
 * Absorção (nível 1-5) e "Só noturnos" (#87) em LISTA VERTICAL com acordeão,
 * multi-seleção via checkbox. Técnica: o grid carrega TODOS os produtos com
 * data-attributes e o filtro esconde os <li> que não casam — instantâneo, sem
 * roundtrip. Regra: OR dentro do grupo, AND entre grupos.
 */
const ORDEM_TAM = ["RN", "P", "P/M", "M", "G", "G/EG", "EG", "XG", "XXG"]
const ORDEM_GEN = ["Unissex", "Masculino", "Feminino", "Infantil"]
const ORDEM_ABS = ["1", "2", "3", "4", "5"]
const ROTULO_ABS: Record<string, string> = {
  "1": "Nível 1 · Leve",
  "2": "Nível 2 · Moderado",
  "3": "Nível 3 · Forte",
  "4": "Nível 4 · Intenso",
  "5": "Nível 5 · Máxima",
}

type Opcao = { valor: string; qtd: number }

type Item = {
  tipo: string
  marca: string
  tamanho: string
  genero: string
  absorcao: string
  noturno: string
}

// só estes participam das facetas/contagens (noturno é um toggle à parte)
const GRUPOS: (keyof Item)[] = ["tipo", "marca", "tamanho", "genero", "absorcao"]

const FiltrosLoja = ({ gridId }: { gridId: string }) => {
  const [itens, setItens] = useState<Item[]>([])
  const [selTipo, setSelTipo] = useState<Set<string>>(new Set())
  const [selMarca, setSelMarca] = useState<Set<string>>(new Set())
  const [selTam, setSelTam] = useState<Set<string>>(new Set())
  const [selGen, setSelGen] = useState<Set<string>>(new Set())
  const [selAbs, setSelAbs] = useState<Set<string>>(new Set())
  const [soNoturno, setSoNoturno] = useState(false)
  const [aberto, setAberto] = useState<Record<string, boolean>>({
    "Tipo de produto": true,
    Marca: true,
    Tamanho: true,
    "Para quem": true,
    Absorção: true,
  })
  const [mostrando, setMostrando] = useState(0)
  const [total, setTotal] = useState(0)
  const [gaveta, setGaveta] = useState(false)

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
          absorcao: li.getAttribute("data-absorcao") || "",
          noturno: li.getAttribute("data-noturno") || "",
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

  // aplica os filtros (OR no grupo, AND entre grupos) + toggle noturno
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
        (selGen.size === 0 || selGen.has(li.getAttribute("data-genero") || "")) &&
        (selAbs.size === 0 || selAbs.has(li.getAttribute("data-absorcao") || "")) &&
        (!soNoturno || (li.getAttribute("data-noturno") || "") === "1")
      li.style.display = ok ? "" : "none"
      if (ok) vis++
    })
    setMostrando(vis)
  }, [selTipo, selMarca, selTam, selGen, selAbs, soNoturno, gridId])

  // FACETS dinâmicos: a contagem de cada opção considera os filtros dos OUTROS
  // grupos (não o próprio). Opção que zera some (a menos que selecionada).
  const sels: Record<string, Set<string>> = {
    tipo: selTipo,
    marca: selMarca,
    tamanho: selTam,
    genero: selGen,
    absorcao: selAbs,
  }
  const { tipos, marcas, tamanhos, generos, absorcoes, nNoturno } = useMemo(() => {
    const casaGrupos = (i: Item, exceto?: keyof Item) =>
      GRUPOS.every(
        (k) => k === exceto || sels[k].size === 0 || sels[k].has(i[k])
      )
    const facet = (campo: keyof Item, ordem?: string[], ultimo?: string): Opcao[] => {
      const totalPor = new Map<string, number>()
      itens.forEach((i) => i[campo] && totalPor.set(i[campo], (totalPor.get(i[campo]) || 0) + 1))
      const dinamico = new Map<string, number>()
      itens.forEach((i) => {
        if (i[campo] && casaGrupos(i, campo))
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
    // noturnos que casam com TODOS os grupos selecionados (dinâmico p/ o toggle)
    const nNot = itens.filter((i) => i.noturno === "1" && casaGrupos(i)).length
    return {
      tipos: facet("tipo", undefined, "Outros"),
      marcas: facet("marca", undefined, "Outras"),
      tamanhos: facet("tamanho", ORDEM_TAM),
      generos: facet("genero", ORDEM_GEN),
      absorcoes: facet("absorcao", ORDEM_ABS),
      nNoturno: nNot,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itens, selTipo, selMarca, selTam, selGen, selAbs])

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, v: string) => {
    const n = new Set(set)
    n.has(v) ? n.delete(v) : n.add(v)
    setter(n)
  }

  const nSel =
    selTipo.size + selMarca.size + selTam.size + selGen.size + selAbs.size + (soNoturno ? 1 : 0)
  const temFiltro = nSel > 0

  // avisa o nº de filtros ativos (badge do botão "Filtros" recolhido no desktop)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("filtros-loja:count", { detail: nSel }))
  }, [nSel])

  const limpar = () => {
    setSelTipo(new Set())
    setSelMarca(new Set())
    setSelTam(new Set())
    setSelGen(new Set())
    setSelAbs(new Set())
    setSoNoturno(false)
  }

  const Grupo = ({
    titulo,
    opcoes,
    sel,
    setter,
    rotular,
  }: {
    titulo: string
    opcoes: Opcao[]
    sel: Set<string>
    setter: (s: Set<string>) => void
    rotular?: (v: string) => string
  }) => {
    if (opcoes.length < 2) return null
    const estaAberto = aberto[titulo] !== false
    return (
      <div className="border-b border-ui-border-base pb-3">
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
                          : "border-ui-border-strong bg-ui-bg-base group-hover:border-copamar-primary/60")
                      }
                      aria-hidden
                    >
                      {ativo ? "✓" : ""}
                    </span>
                    <span className={ativo ? "font-medium text-ui-fg-base" : "text-ui-fg-base"}>
                      {rotular ? rotular(o.valor) : o.valor}
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

  const corpo = (
    <div className="flex flex-col gap-1">
      <Grupo titulo="Tipo de produto" opcoes={tipos} sel={selTipo} setter={setSelTipo} />
      <Grupo titulo="Marca" opcoes={marcas} sel={selMarca} setter={setSelMarca} />
      <Grupo titulo="Tamanho" opcoes={tamanhos} sel={selTam} setter={setSelTam} />
      <Grupo titulo="Para quem" opcoes={generos} sel={selGen} setter={setSelGen} />
      <Grupo
        titulo="Absorção"
        opcoes={absorcoes}
        sel={selAbs}
        setter={setSelAbs}
        rotular={(v) => ROTULO_ABS[v] || `Nível ${v}`}
      />
      {/* toggle "Só noturnos" (#87) — flag à parte do nível */}
      {nNoturno > 0 && (
        <button
          type="button"
          onClick={() => setSoNoturno((v) => !v)}
          aria-pressed={soNoturno}
          className="group flex w-full items-center gap-2.5 rounded-md border-b border-ui-border-base px-1.5 py-2.5 text-left text-sm hover:bg-ui-bg-subtle"
        >
          <span
            className={
              "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold text-white transition " +
              (soNoturno
                ? "border-copamar-primary bg-copamar-primary"
                : "border-ui-border-strong bg-ui-bg-base group-hover:border-copamar-primary/60")
            }
            aria-hidden
          >
            {soNoturno ? "✓" : ""}
          </span>
          <span className={soNoturno ? "font-medium text-ui-fg-base" : "text-ui-fg-base"}>
            🌙 Só noturnos
          </span>
          <span className="ml-auto text-xs text-ui-fg-muted">{nNoturno}</span>
        </button>
      )}
      {temFiltro && (
        <p className="mt-2 text-xs text-ui-fg-subtle">
          {mostrando} de {total} produtos ·{" "}
          <button type="button" onClick={limpar} className="font-semibold text-copamar-primary underline">
            limpar
          </button>
        </p>
      )}
    </div>
  )

  return (
    <>
      {/* ABA fixa na borda esquerda (TODOS os tamanhos — Marco 16/06: gaveta
          deslizante também no desktop, liberando a largura inteira pro grid).
          Vive no vão lateral; some quando a gaveta abre. */}
      <button
        type="button"
        onClick={() => setGaveta(true)}
        aria-label="Abrir filtros"
        className={`fixed left-0 top-1/2 z-30 flex -translate-y-1/2 items-center gap-1.5 rounded-r-2xl bg-copamar-primary py-4 pl-2.5 pr-3 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:pl-4 active:scale-95 ${
          gaveta ? "pointer-events-none -translate-x-full opacity-0" : "opacity-100"
        }`}
      >
        <span aria-hidden>⚙</span>
        <span className="hidden small:inline">Filtros</span>
        <span className="small:hidden" aria-hidden>
          ▸
        </span>
        {nSel > 0 && (
          <span className="rounded-full bg-white px-1.5 text-[11px] font-bold text-copamar-primary">
            {nSel}
          </span>
        )}
      </button>

      {/* BACKDROP com fade */}
      <div
        onClick={() => setGaveta(false)}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          gaveta ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* GAVETA deslizante — montada sempre, desliza via translate (mantém as
          seleções e anima suave ao abrir/fechar) */}
      <aside
        aria-hidden={!gaveta}
        className={`fixed left-0 top-0 z-50 flex h-full w-[86%] max-w-[330px] flex-col bg-ui-bg-base shadow-2xl transition-transform duration-300 ease-out small:max-w-[370px] ${
          gaveta ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-ui-border-base px-4 py-3">
          <span className="text-sm font-bold uppercase tracking-wide text-ui-fg-base">
            Filtros
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
            className="rounded-lg bg-ui-bg-subtle px-3 py-1.5 text-base font-bold text-ui-fg-base transition hover:bg-ui-bg-base active:scale-95"
          >
            ◂
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">{corpo}</div>
        <div className="border-t border-ui-border-base px-4 py-3">
          <button
            type="button"
            onClick={() => setGaveta(false)}
            className="w-full rounded-xl bg-copamar-primary py-3 text-sm font-bold text-white transition hover:bg-copamar-primary-dark active:scale-[0.99]"
          >
            Ver {mostrando} produto{mostrando === 1 ? "" : "s"}
          </button>
        </div>
      </aside>
    </>
  )
}

export default FiltrosLoja
