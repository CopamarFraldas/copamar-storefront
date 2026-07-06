"use client"

import { useCallback, useEffect, useState } from "react"
import Estrelas from "@modules/common/components/estrelas"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Seção "Avaliações" da PDP (Marco: "clientes logados avaliarem produtos,
 * estrelinhas 1 a 5 e comentários") — padrão Amazon/ML: resumo com média
 * grande + form + lista de comentários com "Compra verificada".
 *
 * Client component de propósito: a PDP é CACHEADA — buscar aqui pelo proxy
 * /api/reviews/:id (no-store) garante avaliações sempre frescas. O proxy
 * também diz se o cliente está logado (cookie httpOnly, o JS não enxerga) e
 * devolve `minha` — a avaliação do próprio cliente vem pré-preenchida pra
 * editar (upsert no backend: 1 avaliação por cliente×produto).
 */

type Avaliacao = {
  nome: string
  rating: number
  comentario: string
  verificada: boolean
  created_at: string
}
type Dados = {
  agregado: { media: number; total: number }
  avaliacoes: Avaliacao[]
  minha: { rating: number; comentario: string } | null
  logado: boolean
}

const dataBr = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

const ROTULOS = ["", "Ruim", "Razoável", "Bom", "Muito bom", "Excelente"]

/** 5 estrelas CLICÁVEIS do form (hover + teclado) */
function EstrelasInput({
  valor,
  onChange,
}: {
  valor: number
  onChange: (n: number) => void
}) {
  const [hover, setHover] = useState(0)
  const ativo = hover || valor
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex"
        role="radiogroup"
        aria-label="Sua nota, de 1 a 5 estrelas"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={valor === n}
            aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
            className="p-0.5"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-8 w-8 transition-colors ${
                n <= ativo ? "text-amber-400" : "text-gray-300 dark:text-gray-600"
              }`}
              aria-hidden="true"
            >
              <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.4 4.3a1 1 0 0 0 .95.7h4.52c.97 0 1.37 1.24.59 1.81l-3.66 2.65a1 1 0 0 0-.36 1.12l1.4 4.3c.3.92-.76 1.69-1.54 1.12l-3.66-2.65a1 1 0 0 0-1.18 0l-3.66 2.65c-.78.57-1.83-.2-1.54-1.12l1.4-4.3a1 1 0 0 0-.36-1.12L1.6 9.74c-.78-.57-.38-1.81.59-1.81h4.52a1 1 0 0 0 .95-.7l1.4-4.3Z" />
            </svg>
          </button>
        ))}
      </div>
      {ativo > 0 && (
        <span className="text-sm text-ui-fg-subtle">{ROTULOS[ativo]}</span>
      )}
    </div>
  )
}

export default function AvaliacoesProduto({ productId }: { productId: string }) {
  const [dados, setDados] = useState<Dados | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  // form
  const [rating, setRating] = useState(0)
  const [comentario, setComentario] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [msgForm, setMsgForm] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null)

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`/api/reviews/${encodeURIComponent(productId)}`, {
        cache: "no-store",
      })
      if (!r.ok) throw new Error()
      const d: Dados = await r.json()
      setDados(d)
      setErro(false)
      if (d.minha) {
        setRating(d.minha.rating)
        setComentario(d.minha.comentario || "")
      }
    } catch {
      setErro(true)
    } finally {
      setCarregando(false)
    }
  }, [productId])

  useEffect(() => {
    carregar()
  }, [carregar])

  const enviar = async () => {
    setMsgForm(null)
    if (!rating) {
      setMsgForm({ tipo: "erro", texto: "Escolha uma nota de 1 a 5 estrelas." })
      return
    }
    setEnviando(true)
    try {
      const r = await fetch(`/api/reviews/${encodeURIComponent(productId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating, comentario }),
      })
      const d = await r.json().catch(() => ({}))
      if (r.status === 401) {
        setMsgForm({ tipo: "erro", texto: "Sua sessão expirou — entre na conta pra avaliar." })
      } else if (!r.ok) {
        setMsgForm({ tipo: "erro", texto: d?.message || d?.erro || "Não foi possível salvar. Tente de novo." })
      } else {
        setMsgForm({
          tipo: "ok",
          texto: dados?.minha ? "Avaliação atualizada. Obrigado!" : "Avaliação enviada. Obrigado!",
        })
        await carregar() // lista + média fresquinhas
      }
    } catch {
      setMsgForm({ tipo: "erro", texto: "Não foi possível salvar. Tente de novo." })
    } finally {
      setEnviando(false)
    }
  }

  const agregado = dados?.agregado
  const temAvaliacoes = (agregado?.total ?? 0) > 0

  return (
    <section
      id="avaliacoes"
      aria-labelledby="avaliacoes-h"
      className="content-container scroll-mt-28 py-12 small:py-16"
      data-testid="avaliacoes-produto"
    >
      <h2
        id="avaliacoes-h"
        className="mb-6 text-2xl font-bold text-copamar-primary dark:text-ui-fg-base small:text-3xl"
      >
        Avaliações
      </h2>

      {carregando && (
        <p className="text-ui-fg-subtle" aria-live="polite">
          Carregando avaliações…
        </p>
      )}
      {!carregando && erro && (
        <p className="text-ui-fg-subtle">
          Não foi possível carregar as avaliações agora. Tente de novo mais tarde.
        </p>
      )}

      {!carregando && !erro && dados && (
        <div className="grid gap-10 small:grid-cols-[300px_minmax(0,1fr)] small:gap-14">
          {/* ── resumo + form ── */}
          <div className="flex flex-col gap-8">
            {temAvaliacoes ? (
              <div>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold leading-none text-ui-fg-base">
                    {agregado!.media.toFixed(1).replace(".", ",")}
                  </span>
                  <span className="pb-1 text-sm text-ui-fg-subtle">de 5</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Estrelas media={agregado!.media} tamanho="lg" />
                </div>
                <p className="mt-1 text-sm text-ui-fg-subtle">
                  {agregado!.total}{" "}
                  {agregado!.total === 1 ? "avaliação de cliente" : "avaliações de clientes"}
                </p>
              </div>
            ) : (
              <p className="text-ui-fg-subtle">
                Este produto ainda não tem avaliações.{" "}
                <strong className="text-ui-fg-base">Seja o primeiro a avaliar!</strong>
              </p>
            )}

            {dados.logado ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  enviar()
                }}
                className="flex flex-col gap-3 rounded-large border border-ui-border-base bg-copamar-cream p-4 dark:bg-transparent"
              >
                <p className="font-semibold text-ui-fg-base">
                  {dados.minha ? "Sua avaliação" : "Avalie este produto"}
                </p>
                {dados.minha && (
                  <p className="-mt-2 text-xs text-ui-fg-subtle">
                    Você já avaliou — pode ajustar a nota ou o comentário quando quiser.
                  </p>
                )}
                <EstrelasInput valor={rating} onChange={setRating} />
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  placeholder="Conte como foi sua experiência com o produto (opcional)"
                  className="w-full resize-y rounded-base border border-ui-border-base bg-white p-3 text-sm text-ui-fg-base placeholder:text-ui-fg-muted focus:border-copamar-primary focus:outline-none dark:bg-black/20"
                  data-testid="avaliacao-comentario"
                />
                <button
                  type="submit"
                  disabled={enviando}
                  className="self-start rounded-rounded bg-copamar-cta px-6 py-2.5 text-sm font-bold text-[#0a2e6b] transition-colors hover:bg-copamar-cta-dark disabled:opacity-60"
                  data-testid="avaliacao-enviar"
                >
                  {enviando
                    ? "Enviando…"
                    : dados.minha
                      ? "Atualizar avaliação"
                      : "Enviar avaliação"}
                </button>
                {msgForm && (
                  <p
                    aria-live="polite"
                    className={`text-sm ${
                      msgForm.tipo === "ok" ? "text-green-700 dark:text-green-400" : "text-red-600"
                    }`}
                  >
                    {msgForm.texto}
                  </p>
                )}
              </form>
            ) : (
              <div className="rounded-large border border-ui-border-base bg-copamar-cream p-4 dark:bg-transparent">
                <p className="font-semibold text-ui-fg-base">Comprou este produto?</p>
                <p className="mt-1 text-sm text-ui-fg-subtle">
                  <LocalizedClientLink
                    href="/account"
                    className="font-semibold text-copamar-primary underline"
                  >
                    Entre na sua conta
                  </LocalizedClientLink>{" "}
                  pra avaliar com estrelinhas e comentário.
                </p>
              </div>
            )}
          </div>

          {/* ── lista de comentários ── */}
          <div>
            {temAvaliacoes ? (
              <ul className="flex flex-col divide-y divide-ui-border-base">
                {dados.avaliacoes.map((a, i) => (
                  <li key={i} className="flex flex-col gap-1.5 py-5 first:pt-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-ui-fg-base">{a.nome}</span>
                      {a.verificada && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          ✓ Compra verificada
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Estrelas media={a.rating} tamanho="sm" />
                      <span className="text-xs text-ui-fg-muted">{dataBr(a.created_at)}</span>
                    </div>
                    {a.comentario && (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-ui-fg-subtle">
                        {a.comentario}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ui-fg-muted">
                As avaliações de quem comprou aparecem aqui.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
