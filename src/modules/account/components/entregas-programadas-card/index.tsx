"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  cancelarEntregaProgramada,
  pausarEntregaProgramada,
  pularProximaEntrega,
  reativarEntregaProgramada,
  type EntregaProgramada,
} from "@lib/data/entrega-programada"

/**
 * Card "📦 Minhas entregas programadas" do painel do cliente (/account).
 * Mostra frequência, itens resumidos, próxima data e status, com botões
 * GRANDES (público 45-65): Pular próxima / Pausar / Reativar / Cancelar.
 *
 * Cancelar é HONESTO: 2 toques no máximo (toque → "cancelar mesmo?" inline),
 * sem multa, sem tela de retenção. As ações são server actions que conferem a
 * POSSE da linha contra o cliente logado (nada de confiar no id vindo do
 * browser). O PAI só renderiza o card quando a lista veio (flag ON + logado).
 */

const STATUS_UI: Record<string, { txt: string; cls: string }> = {
  ativa: {
    txt: "Ativa",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  pausada: {
    txt: "Pausada",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  cancelada: {
    txt: "Cancelada",
    cls: "bg-ui-bg-subtle text-ui-fg-subtle",
  },
}

function dataBR(d?: string | null): string | null {
  if (!d) return null
  const dt = new Date(`${d}T12:00:00Z`)
  if (isNaN(dt.getTime())) return null
  return dt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function resumoItens(itens: EntregaProgramada["itens"]): string {
  const nomes = (itens || [])
    .map((i) => (i?.titulo || "").trim())
    .filter(Boolean)
  if (!nomes.length) return "Itens do seu pedido"
  const primeiros = nomes.slice(0, 2).join(" + ")
  const resto = nomes.length - 2
  return resto > 0 ? `${primeiros} + ${resto} item(ns)` : primeiros
}

const btnBase =
  "inline-flex min-h-[48px] items-center justify-center rounded-lg px-4 py-2 text-base font-semibold transition disabled:opacity-60"

const Assinatura = ({ dados }: { dados: EntregaProgramada }) => {
  const [ep, setEp] = useState(dados)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmaCancelar, setConfirmaCancelar] = useState(false)
  const [pulada, setPulada] = useState(false)

  const roda = async (
    acao: string,
    // id é o asn_… da tabela assinaturas (Postgres do Medusa) — string
    fn: (id: string) => Promise<{ ok: boolean; proxima_em?: string; erro?: string }>,
    aplica: (r: { proxima_em?: string }) => void
  ) => {
    setErro(null)
    setOcupado(acao)
    try {
      const r = await fn(ep.id)
      if (r.ok) aplica(r)
      else setErro(r.erro || "Não deu agora — tente de novo.")
    } catch {
      setErro("Não deu agora — tente de novo em instantes.")
    } finally {
      setOcupado(null)
    }
  }

  const proxima = dataBR(ep.proxima_em)
  const st = STATUS_UI[ep.status] || STATUS_UI.ativa

  if (ep.status === "cancelada") {
    return (
      <div
        className="rounded-large border border-ui-border-base bg-ui-bg-subtle px-4 py-3"
        data-testid="ep-cancelada"
      >
        <p className="text-base-regular text-ui-fg-subtle">
          Entrega programada do pedido #{ep.order_display_id} cancelada.
          Quando quiser, é só programar de novo em qualquer pedido — sem
          burocracia.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-large border border-ui-border-base bg-ui-bg-base px-4 py-4"
      data-testid="ep-assinatura"
      data-value={ep.id}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-base-semi text-ui-fg-base">
          A cada {ep.frequencia_semanas} semanas
          <span className="ml-2 text-small-regular text-ui-fg-subtle">
            (pedido #{ep.order_display_id})
          </span>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-small-regular font-semibold ${st.cls}`}
          data-testid="ep-status"
        >
          {st.txt}
        </span>
      </div>

      <p className="mt-1 text-small-regular text-ui-fg-subtle">
        {resumoItens(ep.itens)}
      </p>

      {ep.status === "ativa" && proxima && (
        <p className="mt-2 text-base-regular text-ui-fg-base">
          Próxima entrega: <strong>{proxima}</strong>
          {pulada && (
            <span className="ml-2 text-emerald-700 dark:text-emerald-300 font-medium">
              ✅ próxima pulada!
            </span>
          )}
        </p>
      )}
      {ep.status === "pausada" && (
        <p className="mt-2 text-base-regular text-ui-fg-subtle">
          Pausada — nenhuma entrega será preparada até você reativar.
        </p>
      )}

      {/* ações — botões grandes, sem pegadinha */}
      {!confirmaCancelar ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {ep.status === "ativa" && (
            <>
              <button
                type="button"
                disabled={ocupado !== null}
                onClick={() =>
                  roda("pular", pularProximaEntrega, (r) => {
                    if (r.proxima_em) {
                      setEp({ ...ep, proxima_em: r.proxima_em })
                      setPulada(true)
                    }
                  })
                }
                className={`${btnBase} border border-copamar-primary/40 bg-white text-copamar-primary hover:bg-copamar-primary hover:text-white dark:bg-transparent`}
                data-testid="ep-pular"
              >
                {ocupado === "pular" ? "Um instante…" : "Pular próxima"}
              </button>
              <button
                type="button"
                disabled={ocupado !== null}
                onClick={() =>
                  roda("pausar", pausarEntregaProgramada, () => {
                    setEp({ ...ep, status: "pausada" })
                    setPulada(false)
                  })
                }
                className={`${btnBase} border border-amber-500/50 bg-white text-amber-700 hover:bg-amber-500 hover:text-white dark:bg-transparent dark:text-amber-300`}
                data-testid="ep-pausar"
              >
                {ocupado === "pausar" ? "Um instante…" : "Pausar"}
              </button>
            </>
          )}
          {ep.status === "pausada" && (
            <button
              type="button"
              disabled={ocupado !== null}
              onClick={() =>
                roda("reativar", reativarEntregaProgramada, (r) => {
                  setEp({
                    ...ep,
                    status: "ativa",
                    proxima_em: r.proxima_em || ep.proxima_em,
                  })
                  setPulada(false)
                })
              }
              className={`${btnBase} border border-emerald-500/60 bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white dark:bg-transparent dark:text-emerald-300`}
              data-testid="ep-reativar"
            >
              {ocupado === "reativar" ? "Um instante…" : "Reativar"}
            </button>
          )}
          <button
            type="button"
            disabled={ocupado !== null}
            onClick={() => setConfirmaCancelar(true)}
            className={`${btnBase} border border-ui-border-base bg-white text-ui-fg-subtle hover:border-rose-400 hover:text-rose-600 dark:bg-transparent`}
            data-testid="ep-cancelar"
          >
            Cancelar
          </button>
        </div>
      ) : (
        // 2º (e último) toque do cancelamento — honesto, sem tela de retenção
        <div
          className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-900/40 dark:bg-rose-900/20"
          data-testid="ep-confirma-cancelar"
        >
          <p className="text-base-regular text-ui-fg-base">
            Cancelar esta entrega programada? Sem multa nenhuma — e você pode
            programar de novo quando quiser.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={ocupado !== null}
              onClick={() =>
                roda("cancelar", cancelarEntregaProgramada, () => {
                  setEp({ ...ep, status: "cancelada" })
                  setConfirmaCancelar(false)
                })
              }
              className={`${btnBase} bg-rose-600 text-white hover:bg-rose-700`}
              data-testid="ep-cancelar-sim"
            >
              {ocupado === "cancelar" ? "Um instante…" : "Sim, cancelar"}
            </button>
            <button
              type="button"
              disabled={ocupado !== null}
              onClick={() => setConfirmaCancelar(false)}
              className={`${btnBase} border border-ui-border-base bg-white text-ui-fg-base hover:bg-ui-bg-subtle dark:bg-transparent`}
              data-testid="ep-cancelar-nao"
            >
              Manter
            </button>
          </div>
        </div>
      )}

      {erro && (
        <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{erro}</p>
      )}
    </div>
  )
}

const EntregasProgramadasCard = ({
  entregas,
  avisoCiclo,
}: {
  entregas: EntregaProgramada[]
  /** true quando o cliente veio de um link mágico cujo ciclo já era (pago/vencido) */
  avisoCiclo?: boolean
}) => {
  if (!entregas?.length && !avisoCiclo) return null

  return (
    <div
      className="rounded-large border border-ui-border-base bg-copamar-cream px-4 py-3"
      data-testid="entregas-programadas-card"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-base-semi text-ui-fg-base">
          📦 Minhas entregas programadas
        </div>
        <LocalizedClientLink
          href="/entrega-programada"
          className="shrink-0 text-small-regular font-semibold text-copamar-primary underline"
        >
          Como funciona
        </LocalizedClientLink>
      </div>

      {avisoCiclo && (
        <p
          className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-small-regular text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200"
          data-testid="ep-aviso-ciclo"
        >
          Essa entrega já foi paga ou o link venceu — tudo certo! Suas próximas
          entregas seguem abaixo.
        </p>
      )}

      {entregas?.length ? (
        <div className="mt-3 flex flex-col gap-y-3">
          {entregas.map((ep) => (
            <Assinatura key={ep.id} dados={ep} />
          ))}
        </div>
      ) : (
        <p className="mt-2 text-small-regular text-ui-fg-subtle">
          Você não tem entregas programadas no momento. Dá pra programar em
          qualquer pedido — com 5% de desconto em toda entrega.
        </p>
      )}
    </div>
  )
}

export default EntregasProgramadasCard
