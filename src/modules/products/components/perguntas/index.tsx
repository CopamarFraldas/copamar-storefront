"use client"

import { useCallback, useEffect, useState } from "react"
import { enviarPerguntaProduto } from "@lib/data/perguntas"

/**
 * Seção "Perguntas e respostas" da PDP (estilo Amazon — quem interage com Q&A
 * converte mais). Fica logo abaixo das Avaliações.
 *
 * - Lista as perguntas PUBLICADAS (pergunta + resposta + "Respondido pela
 *   equipe Copamar" + data; nome exibível tipo "Maria S.", mesmo padrão das
 *   reviews) — client-side pelo proxy /api/perguntas/:id (a PDP é cacheada;
 *   a lista fica sempre fresca).
 * - Form "Tem uma dúvida? Pergunte!" → server action enviarPerguntaProduto
 *   (sanitize + rate limit). A pergunta entra como 'pendente' e SÓ aparece
 *   depois que a equipe responde — por isso o sucesso não recarrega a lista.
 * - Sem perguntas publicadas → a seção mostra só o formulário.
 */

type Pergunta = {
  nome: string
  pergunta: string
  resposta: string
  respondido_em: string | null
  criado_em: string
}

const dataBr = (iso: string | null) => {
  if (!iso) return ""
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

export default function PerguntasProduto({
  productId,
  handle,
}: {
  productId: string
  handle?: string | null
}) {
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [carregando, setCarregando] = useState(true)

  // form
  const [pergunta, setPergunta] = useState("")
  const [nome, setNome] = useState("")
  const [celular, setCelular] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null)

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`/api/perguntas/${encodeURIComponent(productId)}`, {
        cache: "no-store",
      })
      if (!r.ok) throw new Error()
      const d = await r.json()
      setPerguntas(Array.isArray(d?.perguntas) ? d.perguntas : [])
    } catch {
      // lista indisponível → segue só com o formulário (nunca quebra a página)
      setPerguntas([])
    } finally {
      setCarregando(false)
    }
  }, [productId])

  useEffect(() => {
    carregar()
  }, [carregar])

  const enviar = async () => {
    setMsg(null)
    if (pergunta.trim().length < 5) {
      setMsg({ tipo: "erro", texto: "Escreva sua pergunta (pelo menos 5 letras)." })
      return
    }
    if (nome.trim().length < 2) {
      setMsg({ tipo: "erro", texto: "Diga seu nome (pode ser só o primeiro)." })
      return
    }
    setEnviando(true)
    try {
      const r = await enviarPerguntaProduto({
        productId,
        handle: handle || undefined,
        pergunta,
        nome,
        celular: celular || undefined,
      })
      if (!r.ok) {
        setMsg({ tipo: "erro", texto: r.erro })
      } else {
        setMsg({
          tipo: "ok",
          texto: celular.trim()
            ? "Pergunta enviada! Assim que a equipe responder, ela aparece aqui — e a gente te avisa no WhatsApp."
            : "Pergunta enviada! Assim que a equipe responder, ela aparece aqui.",
        })
        setPergunta("")
        setCelular("")
      }
    } catch {
      setMsg({ tipo: "erro", texto: "Não foi possível enviar agora. Tente de novo." })
    } finally {
      setEnviando(false)
    }
  }

  const temPerguntas = perguntas.length > 0

  return (
    <section
      id="perguntas"
      aria-labelledby="perguntas-h"
      className="content-container scroll-mt-28 py-12 small:py-16"
      data-testid="perguntas-produto"
    >
      <h2
        id="perguntas-h"
        className="mb-6 text-2xl font-bold text-copamar-primary dark:text-ui-fg-base small:text-3xl"
      >
        Perguntas e respostas
      </h2>

      <div
        className={`grid gap-10 ${
          temPerguntas ? "small:grid-cols-[340px_minmax(0,1fr)] small:gap-14" : ""
        }`}
      >
        {/* ── form "Tem uma dúvida? Pergunte!" ── */}
        <div className={temPerguntas ? "" : "max-w-2xl"}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              enviar()
            }}
            className="flex flex-col gap-3 rounded-large border border-ui-border-base bg-copamar-cream p-4 dark:bg-transparent"
          >
            <p className="font-semibold text-ui-fg-base">Tem uma dúvida? Pergunte!</p>
            <p className="-mt-2 text-sm text-ui-fg-subtle">
              A equipe Copamar responde e a resposta fica aqui pra ajudar outros clientes.
            </p>
            <label className="flex flex-col gap-1 text-sm font-medium text-ui-fg-base">
              Sua pergunta
              <textarea
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                maxLength={1000}
                rows={5}
                required
                placeholder="Ex.: Essa fralda serve pra quem pesa 80 kg? Segura a noite toda?"
                className="w-full resize-y rounded-base border border-ui-border-base bg-white p-3 text-base font-normal text-ui-fg-base placeholder:text-ui-fg-muted focus:border-copamar-primary focus:outline-none dark:bg-black/20"
                data-testid="pergunta-texto"
              />
            </label>
            <div className="grid gap-3 small:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-medium text-ui-fg-base">
                Seu nome
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={80}
                  required
                  autoComplete="name"
                  placeholder="Ex.: Maria Silva"
                  className="w-full rounded-base border border-ui-border-base bg-white p-3 text-base font-normal text-ui-fg-base placeholder:text-ui-fg-muted focus:border-copamar-primary focus:outline-none dark:bg-black/20"
                  data-testid="pergunta-nome"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-ui-fg-base">
                WhatsApp (opcional)
                <input
                  type="tel"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  maxLength={20}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="(11) 90000-0000 — pra te avisarmos da resposta"
                  className="w-full rounded-base border border-ui-border-base bg-white p-3 text-base font-normal text-ui-fg-base placeholder:text-ui-fg-muted focus:border-copamar-primary focus:outline-none dark:bg-black/20"
                  data-testid="pergunta-celular"
                />
              </label>
            </div>
            <p className="text-xs text-ui-fg-muted">
              Sua pergunta pode ser publicada de forma anônima após revisão. Não
              inclua dados pessoais.
            </p>
            <button
              type="submit"
              disabled={enviando}
              className="self-start rounded-rounded bg-copamar-cta px-6 py-2.5 text-sm font-bold text-[#0a2e6b] transition-colors hover:bg-copamar-cta-dark disabled:opacity-60"
              data-testid="pergunta-enviar"
            >
              {enviando ? "Enviando…" : "Enviar pergunta"}
            </button>
            {msg && (
              <p
                aria-live="polite"
                className={`text-sm ${
                  msg.tipo === "ok" ? "text-green-700 dark:text-green-400" : "text-red-600"
                }`}
              >
                {msg.texto}
              </p>
            )}
          </form>
        </div>

        {/* ── perguntas publicadas (sem perguntas → só o form acima) ── */}
        {temPerguntas && (
          <div>
            <ul className="flex flex-col divide-y divide-ui-border-base">
              {perguntas.map((p, i) => (
                <li key={i} className="flex flex-col gap-2 py-5 first:pt-0">
                  <div className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-copamar-primary/10 text-xs font-bold text-copamar-primary dark:bg-white/10 dark:text-ui-fg-base"
                    >
                      P
                    </span>
                    <div>
                      <p className="whitespace-pre-line font-semibold leading-relaxed text-ui-fg-base">
                        {p.pergunta}
                      </p>
                      <p className="mt-0.5 text-xs text-ui-fg-muted">
                        {p.nome}
                        {dataBr(p.criado_em) ? ` · ${dataBr(p.criado_em)}` : ""}
                      </p>
                    </div>
                  </div>
                  {p.resposta && (
                    <div className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-copamar-cta/30 text-xs font-bold text-[#0a2e6b] dark:bg-copamar-cta/20 dark:text-ui-fg-base"
                      >
                        R
                      </span>
                      <div>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-ui-fg-subtle">
                          {p.resposta}
                        </p>
                        <p className="mt-0.5 text-xs text-ui-fg-muted">
                          Respondido pela equipe Copamar
                          {dataBr(p.respondido_em) ? ` · ${dataBr(p.respondido_em)}` : ""}
                        </p>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* carregando: o form já aparece; a lista chega quando chegar (sem CLS
          brusco — a coluna da lista só monta se houver perguntas) */}
      {carregando && <span className="sr-only">Carregando perguntas…</span>}
    </section>
  )
}
