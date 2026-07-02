"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Consultor de frete por CEP (#9) — mostra o frete CEDO, na home e na PDP, com a
 * lógica REAL: frota própria por faixa de CEP (grátis nas ~5,2 mil faixas da
 * Grande SP) ou Frenet (lista de modalidades Correios/transportadoras, cada uma
 * com preço e prazo REAL). Nunca selo genérico "grátis acima de R$ X".
 *
 * - compact (home): destaca o resultado e esconde a lista atrás de "ver opções".
 * - completo (PDP): já mostra a lista.
 * - ouvirPdp (PDP): escuta a seleção de VARIANTE + QUANTIDADE do ProductActions
 *   (evento "copamar:pdp-frete", são irmãos no layout) e RECOTA quando muda —
 *   antes o frete da PDP travava em 1 unidade (Marco 23/06). Manda quantity pro
 *   /store/frete, que cota N unidades.
 * O CEP fica salvo (localStorage) e é reaproveitado entre páginas.
 */
type Opcao = {
  servico: string
  transportadora: string
  price: number
  prazo: number | null
}
type Resultado = {
  frota_propria?: boolean
  gratis?: boolean
  a_partir?: number | null
  estimativa?: boolean
  opcoes?: Opcao[]
  sem_cotacao?: boolean
  error?: string
}

const CEP_KEY = "copamar_cep"
const WHATS_FRETE =
  "https://wa.me/551149903013?text=" +
  encodeURIComponent(
    "Olá! Não sei meu frete. Pode me ajudar a calcular o frete e o prazo?"
  )
const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
const maskCep = (v: string) =>
  v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2")
const prazoTxt = (p: number | null) =>
  p ? `~${p} ${p === 1 ? "dia útil" : "dias úteis"}` : "prazo no checkout"

const FreteCep = ({
  variantId,
  compact = false,
  ouvirPdp = false,
}: {
  variantId?: string
  compact?: boolean
  /** PDP: reagir à variante/quantidade escolhidas no ProductActions */
  ouvirPdp?: boolean
}) => {
  const [cep, setCep] = useState("")
  const [res, setRes] = useState<Resultado | null>(null)
  const [loading, setLoading] = useState(false)
  const [verOpcoes, setVerOpcoes] = useState(!compact)
  const [qtd, setQtd] = useState(1) // só pra rótulo "para N unidades"
  const reqRef = useRef(0)
  const cepRef = useRef("") // último CEP válido (pra recotar ao mudar a qtd)
  const vidRef = useRef<string | undefined>(variantId)
  const qtyRef = useRef(1)
  const sigRef = useRef("") // assinatura da última cotação (evita repique inútil)
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const consultar = async (cepRaw: string) => {
    const digits = cepRaw.replace(/\D/g, "")
    if (digits.length !== 8) return
    cepRef.current = digits
    const vid = vidRef.current
    const q = Math.max(1, qtyRef.current || 1)
    sigRef.current = `${digits}|${vid || ""}|${q}`
    setLoading(true)
    setRes(null)
    setVerOpcoes(!compact)
    const id = ++reqRef.current
    try {
      try {
        localStorage.setItem(CEP_KEY, digits)
      } catch {}
      const params = new URLSearchParams({ cep: digits })
      if (vid) params.set("variant_id", vid)
      if (q > 1) params.set("quantity", String(q))
      // no-store: a cotação tem que refletir a quantidade atual (sem cache)
      const r = await fetch(`/api/frete-cep?${params.toString()}`, {
        cache: "no-store",
      })
      const d = await r.json()
      if (id === reqRef.current) {
        setRes(d)
        setQtd(q)
      }
    } catch {
      if (id === reqRef.current) setRes({ sem_cotacao: true })
    } finally {
      if (id === reqRef.current) setLoading(false)
    }
  }

  // recupera o CEP salvo e já calcula ao montar
  useEffect(() => {
    vidRef.current = variantId
    let salvo = ""
    try {
      salvo = localStorage.getItem(CEP_KEY) || ""
    } catch {}
    if (salvo.length === 8) {
      setCep(maskCep(salvo))
      consultar(salvo)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantId])

  // PDP: escuta a seleção (variante + quantidade) e recota com debounce
  useEffect(() => {
    if (!ouvirPdp) return
    const onSel = (e: Event) => {
      const d = (e as CustomEvent).detail || {}
      if (d.variantId) vidRef.current = d.variantId
      if (d.quantity) qtyRef.current = Math.max(1, Number(d.quantity) || 1)
      // só recota com CEP válido em tela e se algo de fato mudou
      if (cepRef.current.length !== 8) return
      const novaSig = `${cepRef.current}|${vidRef.current || ""}|${qtyRef.current}`
      if (novaSig === sigRef.current) return
      if (debRef.current) clearTimeout(debRef.current)
      debRef.current = setTimeout(() => consultar(cepRef.current), 500)
    }
    window.addEventListener("copamar:pdp-frete", onSel)
    return () => {
      window.removeEventListener("copamar:pdp-frete", onSel)
      if (debRef.current) clearTimeout(debRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvirPdp])

  const opcoes = res?.opcoes || []
  const temLista = opcoes.length > 0
  const sufixoQtd = qtd > 1 ? ` · ${qtd} unidades` : ""

  return (
    <div
      className={`rounded-large border border-ui-border-base bg-ui-bg-subtle ${
        compact ? "flex h-full flex-col p-5" : "p-4"
      }`}
    >
      <div className="flex items-center gap-x-2">
        <span aria-hidden>🚚</span>
        <span className="text-sm font-semibold text-ui-fg-base">
          Calcular frete e prazo
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          consultar(cep)
        }}
        className="mt-3 flex gap-2"
      >
        <label htmlFor="frete-cep" className="sr-only">
          Seu CEP
        </label>
        <input
          id="frete-cep"
          inputMode="numeric"
          enterKeyHint="search"
          value={cep}
          onChange={(e) => {
            const m = maskCep(e.target.value)
            setCep(m)
            if (m.replace(/\D/g, "").length === 8) consultar(m)
          }}
          placeholder="Digite seu CEP"
          className="h-10 w-36 rounded-lg border border-ui-border-base bg-ui-bg-base px-3 text-base small:text-sm text-ui-fg-base outline-none focus:border-copamar-primary focus:ring-1 focus:ring-copamar-primary"
        />
        <button
          type="submit"
          className="h-10 shrink-0 rounded-lg bg-copamar-primary px-4 text-sm font-semibold text-white transition hover:bg-copamar-primary-dark disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "…" : "Calcular"}
        </button>
      </form>

      {/* atalho logo abaixo do campo de CEP pra quem não sabe o próprio frete */}
      <a
        href={WHATS_FRETE}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs font-semibold text-copamar-primary underline"
      >
        Não sei meu frete
      </a>

      {/* resultado */}
      {res && !loading && (
        <div className="mt-3">
          {res.gratis ? (
            <p className="flex items-center gap-x-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              ✅ {(res as any).gratis_minimo
                ? `Entrega Copamar grátis acima de R$ ${(res as any).gratis_minimo} (abaixo, R$ 9,90)`
                : "Frete grátis no seu endereço!"}
              {opcoes[0]?.prazo ? (
                <span className="font-normal">· {prazoTxt(opcoes[0].prazo)}</span>
              ) : null}
            </p>
          ) : res.frota_propria && temLista ? (
            <p className="text-sm text-ui-fg-base">
              <span className="font-semibold text-copamar-primary">
                Entrega Copamar: {brl(opcoes[0].price)}
              </span>{" "}
              <span className="text-ui-fg-subtle">· {prazoTxt(opcoes[0].prazo)}</span>
            </p>
          ) : temLista ? (
            <div>
              <p className="text-sm text-ui-fg-base">
                Frete{" "}
                <span className="font-semibold text-copamar-primary">
                  a partir de {brl(res.a_partir ?? opcoes[0].price)}
                </span>
                {opcoes[0]?.prazo ? (
                  <span className="text-ui-fg-subtle">
                    {" "}
                    · {prazoTxt(opcoes[0].prazo)}
                  </span>
                ) : null}
                {sufixoQtd && (
                  <span className="text-ui-fg-subtle">{sufixoQtd}</span>
                )}
                {res.estimativa && (
                  <span className="text-ui-fg-subtle"> (estimado)</span>
                )}
              </p>

              {compact && !verOpcoes && opcoes.length > 1 && (
                <button
                  type="button"
                  onClick={() => setVerOpcoes(true)}
                  className="mt-1 text-xs font-semibold text-copamar-primary underline"
                >
                  ver {opcoes.length} opções de entrega
                </button>
              )}

              {verOpcoes && (
                <ul className="mt-2 divide-y divide-ui-border-base rounded-lg border border-ui-border-base bg-ui-bg-base">
                  {opcoes.map((o, i) => (
                    <li
                      key={`${o.servico}-${i}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate text-ui-fg-base">
                        {o.servico}
                        {o.transportadora &&
                        !o.servico
                          .toLowerCase()
                          .includes(o.transportadora.toLowerCase()) ? (
                          <span className="text-ui-fg-subtle">
                            {" "}
                            · {o.transportadora}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="font-semibold text-ui-fg-base">
                          {brl(o.price)}
                        </span>
                        <span className="block text-xs text-ui-fg-subtle">
                          {prazoTxt(o.prazo)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {res.estimativa && (
                <p className="mt-1 text-xs text-ui-fg-subtle">
                  Estimativa pra um pacote médio — o valor exato sai no carrinho,
                  conforme o produto.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-ui-fg-subtle">
              Não consegui calcular pra esse CEP agora. Confira o número ou fale com
              a gente no WhatsApp que a gente cota pra você.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default FreteCep
