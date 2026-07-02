"use client"

import { useEffect, useState } from "react"
import { Text } from "@medusajs/ui"
import { getRastreio } from "@lib/data/rastreio"
import { getPainelPedido, type PainelPedido } from "@lib/data/pedido-painel"

type Rastreio = Awaited<ReturnType<typeof getRastreio>>

/**
 * "Acompanhe sua entrega" (#164 + painel rico Marco 18/06) — bloco na página do
 * pedido. Dois mundos:
 *  - FROTA PRÓPRIA (Dedé, ABC): timeline visual (confirmado → saiu p/ entrega →
 *    entregue), quem recebeu e a FOTO do comprovante (vinda assinada do backend).
 *  - TRANSPORTADORA: código de rastreio + status (esteira n8n, pedidos_rastreio).
 * + avaliação pós-entrega (#71) se o cliente já tiver dado a nota.
 */
// fuso fixo de SP: a hora da entrega é a da operação (frota), não a do device do cliente
const fmtHora = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : ""
const fmtData = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : ""

function Passo({
  feito,
  icone,
  titulo,
  detalhe,
  ultimo,
}: {
  feito: boolean
  icone: string
  titulo: string
  detalhe?: string
  ultimo?: boolean
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${
            feito
              ? "bg-emerald-100 text-emerald-700"
              : "bg-ui-bg-subtle text-ui-fg-muted"
          }`}
          aria-hidden
        >
          {icone}
        </div>
        {!ultimo && (
          <div
            className={`w-0.5 flex-1 ${feito ? "bg-emerald-200" : "bg-ui-border-base"}`}
            style={{ minHeight: 18 }}
          />
        )}
      </div>
      <div className={ultimo ? "" : "pb-4"}>
        <Text
          className={`text-base ${
            feito ? "text-ui-fg-base font-medium" : "text-ui-fg-subtle"
          }`}
        >
          {titulo}
        </Text>
        {detalhe && (
          <Text className="text-sm text-ui-fg-subtle">{detalhe}</Text>
        )}
      </div>
    </div>
  )
}

const RastreioEntrega = ({
  orderId,
  blingOrderId,
  createdAt,
}: {
  orderId?: string
  blingOrderId?: string | number | null
  createdAt?: string
}) => {
  const [painel, setPainel] = useState<PainelPedido | null>(null)
  const [rastreio, setRastreio] = useState<Rastreio>(null)
  const [loaded, setLoaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [fotoAberta, setFotoAberta] = useState(false)

  useEffect(() => {
    let vivo = true
    Promise.all([
      orderId ? getPainelPedido(orderId).catch(() => null) : Promise.resolve(null),
      blingOrderId ? getRastreio(blingOrderId).catch(() => null) : Promise.resolve(null),
    ]).then(([p, r]) => {
      if (!vivo) return
      setPainel(p)
      setRastreio(r)
      setLoaded(true)
    })
    return () => {
      vivo = false
    }
  }, [orderId, blingOrderId])

  if (!loaded) return null

  const entrega = painel?.entrega || null
  const avaliacao = painel?.avaliacao || null
  const entregue = !!entrega?.entregue_em || !!rastreio?.entregue
  const emRota = !!entrega?.em_rota_em && !entregue

  const copiar = async () => {
    if (!rastreio?.codigo) return
    try {
      await navigator.clipboard.writeText(rastreio.codigo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  // nada pra mostrar (pedido ainda sem nenhum sinal de entrega)
  const temAlgo =
    entrega || rastreio?.codigo || rastreio?.entregue || blingOrderId
  if (!temAlgo) return null

  return (
    <div className="bg-ui-bg-base rounded-lg border border-ui-border-base p-5">
      <Text className="txt-medium-plus text-ui-fg-base mb-4">
        Acompanhe sua entrega
      </Text>

      {entrega ? (
        // FROTA PRÓPRIA — timeline visual
        <div>
          <Passo
            feito
            icone="📝"
            titulo="Pedido confirmado"
            detalhe={createdAt ? fmtData(createdAt) : undefined}
          />
          <Passo
            feito={emRota || entregue}
            icone="🚚"
            titulo={emRota || entregue ? "Saiu para entrega" : "Em preparação"}
            detalhe={
              emRota
                ? `Nossa equipe está a caminho${
                    entrega.em_rota_em ? ` — ${fmtData(entrega.em_rota_em)}` : ""
                  }`
                : entregue
                ? entrega.em_rota_em
                  ? `Saiu em ${fmtData(entrega.em_rota_em)}`
                  : undefined
                : "Estamos separando seu pedido"
            }
          />
          <Passo
            ultimo
            feito={entregue}
            icone="📦"
            titulo={entregue ? "Entregue" : "Entrega"}
            detalhe={
              entregue
                ? `${fmtHora(entrega.entregue_em)}${
                    entrega.recebedor ? ` · recebido por ${entrega.recebedor}` : ""
                  }`
                : "Em breve na sua casa 💙"
            }
          />

          {entrega.foto_url && (
            <div className="mt-3">
              <Text className="text-sm text-ui-fg-subtle mb-1">
                Foto da entrega:
              </Text>
              <button
                type="button"
                aria-pressed={fotoAberta}
                aria-label={fotoAberta ? "Reduzir foto da entrega" : "Ampliar foto da entrega"}
                onClick={() => setFotoAberta((v) => !v)}
                className="block overflow-hidden rounded-lg border border-ui-border-base"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entrega.foto_url}
                  alt="Comprovante de entrega"
                  className={`object-cover transition-all ${
                    fotoAberta ? "max-h-none w-full" : "h-28 w-28"
                  }`}
                />
              </button>
              <Text className="text-xs text-ui-fg-muted mt-1">
                {fotoAberta ? "toque para reduzir" : "toque para ampliar"}
              </Text>
            </div>
          )}
        </div>
      ) : rastreio?.entregue ? (
        <Text className="text-emerald-700 text-base">
          ✅ Pedido entregue
          {rastreio.entregueEm ? ` em ${fmtData(rastreio.entregueEm)}` : ""}.
          Obrigado pela confiança! 💙
        </Text>
      ) : rastreio?.codigo ? (
        // TRANSPORTADORA — código de rastreio
        <div className="flex flex-col gap-1 text-base text-ui-fg-subtle">
          {rastreio.transportadora && (
            <span>
              Transportadora:{" "}
              <strong className="text-ui-fg-base">{rastreio.transportadora}</strong>
            </span>
          )}
          <span className="flex items-center gap-2 flex-wrap">
            Código de rastreio:{" "}
            <strong className="text-ui-fg-base">{rastreio.codigo}</strong>
            <button
              type="button"
              onClick={copiar}
              className="text-ui-fg-interactive hover:underline text-sm"
            >
              {copied ? "copiado!" : "copiar"}
            </button>
          </span>
          {rastreio.status && (
            <span className="text-sm">Status: {rastreio.status}</span>
          )}
        </div>
      ) : (
        <Text className="text-base text-ui-fg-subtle">
          📦 Estamos preparando seu pedido. Assim que ele sair para entrega, o
          acompanhamento aparece aqui — e a gente te avisa no WhatsApp.
        </Text>
      )}

      {avaliacao?.nota != null && (
        <div className="mt-4 border-t border-ui-border-base pt-3">
          <Text className="text-sm text-ui-fg-subtle">
            Você avaliou esta entrega:{" "}
            <span className="text-base text-amber-500">
              {"★".repeat(avaliacao.nota)}
              <span className="text-ui-fg-muted">
                {"★".repeat(Math.max(0, 5 - avaliacao.nota))}
              </span>
            </span>
          </Text>
        </div>
      )}
    </div>
  )
}

export default RastreioEntrega
