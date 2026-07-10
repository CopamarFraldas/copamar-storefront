"use server"

import { sdk } from "@lib/config"
import { adesaoHmacHex } from "@lib/util/assinatura-token"
import { getAuthHeaders } from "./cookies"

/**
 * 📦 Entrega Programada — camada de dados do storefront (desenho aprovado pelo
 * Marco 10/07): depois de comprar, o cliente transforma o pedido em entrega
 * recorrente ("a cada 2/3/4/6 semanas") e ganha 5% EM TODA ENTREGA, em QUALQUER
 * forma de pagamento (o 5% da assinatura SUBSTITUI o PIX5, nunca soma; não
 * acumula com cupom manual nem resgate de cashback nesta fase).
 *
 * SEM cobrança automática (não guardamos cartão): o MOTOR do servidor (job
 * assinatura-ciclo.py, cron 09:23) varre a tabela, monta o carrinho do ciclo a
 * preços ATUAIS com a promoção ASSINATURA5 aplicada, e manda o WhatsApp com o
 * link mágico /br/assinatura/{token} → checkout pronto.
 *
 * ONDE MORA O DADO (contrato com o motor — revisão 10/07): tabela `assinaturas`
 * no POSTGRES DO MEDUSA (não Supabase!) — o motor precisa de joins atômicos com
 * order/cart pra detectar pagamento. O front NUNCA fala com o banco: tudo passa
 * pelas rotas do backend (padrão cashback):
 *
 *   GET  /store/entrega-programada/config      (publishable key)
 *        → { ativo }  — kill-switch copamar_kv 'entrega_programada' (nasce OFF)
 *   GET  /store/assinaturas                    (autenticada)
 *        → { ativo, assinaturas: [...] } do cliente logado
 *   POST /store/assinaturas                    (autenticada)
 *        body { order_display_id, frequencia_dias }
 *   POST /store/assinaturas/aderir             (HMAC server-action, SEM login)
 *        body { order_id, frequencia_dias } + header x-assinatura-adesao
 *        (padrão lembrete-recompra: o backend RELÊ o pedido no banco; daqui só
 *        saem order_id + frequência — nada do browser é confiável)
 *   POST /store/assinaturas/:id/{pausar|retomar|cancelar|pular} (autenticada)
 *
 * A UI fala SEMANAS (2/3/4/6, público 45-65); o motor fala DIAS (14/21/28/42).
 * A conversão mora AQUI (×7 / ÷7) — nunca nos componentes.
 *
 * TUDO fail-quiet: backend fora / flag OFF / deslogado → null/erro amigável,
 * o site nunca quebra por causa da entrega programada.
 */

const SEMANAS_VALIDAS = [2, 3, 4, 6]

export type EntregaProgramada = {
  /** id da linha em assinaturas (asn_…) — Postgres do Medusa */
  id: string
  order_display_id: number
  frequencia_semanas: number
  /** YYYY-MM-DD */
  proxima_em: string
  status: "ativa" | "pausada" | "cancelada"
  itens: { variant_id: string; quantity: number; titulo?: string }[]
}

export type ResultadoAcaoEP =
  | { ok: true; proxima_em?: string }
  | { ok: false; erro: string }

const ERRO_GENERICO = "Não deu agora — tente de novo em instantes."

/**
 * Kill-switch (copamar_kv 'entrega_programada') via backend — pra SERVER
 * components e actions. Fail-CLOSED: qualquer falha → { ativo: false }
 * (o programa nasce desligado; nunca prometer 5% com a flag OFF).
 */
export async function getEntregaProgramadaConfig(): Promise<{
  ativo: boolean
}> {
  const base = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  try {
    const r = await fetch(`${base}/store/entrega-programada/config`, {
      headers: { "x-publishable-api-key": pk },
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    })
    if (!r.ok) return { ativo: false }
    const d = await r.json()
    return { ativo: d?.ativo === true }
  } catch {
    return { ativo: false }
  }
}

/**
 * Adesão — transforma o pedido em Entrega Programada. Padrão lembrete-recompra
 * levado ao backend: daqui saem SÓ order_id + frequência, assinados com a
 * ASSINATURA_SECRET (header x-assinatura-adesao); o backend RELÊ o pedido no
 * banco (celular/email/itens — fonte da verdade) e faz o upsert (re-aderir ou
 * trocar a frequência ATUALIZA a linha viva e volta pra 'ativa').
 */
export async function aderirEntregaProgramada(
  orderId: string,
  semanas: number
): Promise<{ ok: true; semanas: number } | { ok: false; erro: string }> {
  try {
    if (!SEMANAS_VALIDAS.includes(Number(semanas))) {
      return { ok: false, erro: "Escolha 2, 3, 4 ou 6 semanas." }
    }
    const oid = String(orderId || "").trim()
    if (!oid.startsWith("order_")) {
      return { ok: false, erro: "Não encontramos esse pedido." }
    }
    const frequenciaDias = Number(semanas) * 7

    const base = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
    const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    const r = await fetch(`${base}/store/assinaturas/aderir`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": pk,
        "x-assinatura-adesao": adesaoHmacHex(oid, frequenciaDias),
      },
      body: JSON.stringify({ order_id: oid, frequencia_dias: frequenciaDias }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    })
    if (!r.ok) {
      const d = await r.json().catch(() => null)
      const msg = String(d?.message || "")
      if (/celular/i.test(msg)) {
        return { ok: false, erro: "Esse pedido não tem celular cadastrado." }
      }
      if (/desativada/i.test(msg)) {
        return { ok: false, erro: "Entrega programada indisponível agora." }
      }
      return { ok: false, erro: "Não conseguimos programar agora." }
    }
    return { ok: true, semanas: Number(semanas) }
  } catch {
    return { ok: false, erro: "Não conseguimos programar agora." }
  }
}

/**
 * Lista as entregas programadas do cliente LOGADO (card do /account).
 * null = deslogado / flag OFF / falha — o card simplesmente não aparece.
 * Canceladas ficam de fora (o backend já filtra). A POSSE é do backend:
 * e-mail sai da SESSÃO (auth_context), nunca de parâmetro.
 */
export async function listarEntregasProgramadas(): Promise<
  EntregaProgramada[] | null
> {
  try {
    const authHeaders = await getAuthHeaders()
    if (!("authorization" in authHeaders)) return null

    const d = await sdk.client.fetch<{ ativo?: boolean; assinaturas?: any[] }>(
      `/store/assinaturas`,
      {
        method: "GET",
        headers: { ...authHeaders },
        cache: "no-store",
      }
    )
    if (d?.ativo !== true || !Array.isArray(d.assinaturas)) return null
    return d.assinaturas.map(mapAssinatura).filter(Boolean) as EntregaProgramada[]
  } catch {
    return null
  }
}

/** shape do backend (frequencia_dias, origem_display_id) → shape da UI (semanas) */
function mapAssinatura(a: any): EntregaProgramada | null {
  if (!a?.id) return null
  return {
    id: String(a.id),
    order_display_id: Number(a.origem_display_id || 0),
    frequencia_semanas: Math.max(1, Math.round(Number(a.frequencia_dias || 28) / 7)),
    proxima_em: String(a.proxima_em || "").slice(0, 10),
    status: a.status === "pausada" || a.status === "cancelada" ? a.status : "ativa",
    itens: Array.isArray(a.itens) ? a.itens : [],
  }
}

/** POST autenticado numa ação do painel — o backend confere a posse da linha. */
async function acao(
  id: string,
  nome: "pausar" | "retomar" | "cancelar" | "pular"
): Promise<ResultadoAcaoEP> {
  try {
    const authHeaders = await getAuthHeaders()
    if (!("authorization" in authHeaders)) {
      return { ok: false, erro: "Entre na sua conta para gerenciar." }
    }
    if (!/^asn_[0-9a-f]{32}$/i.test(String(id || ""))) {
      return { ok: false, erro: ERRO_GENERICO }
    }
    const d = await sdk.client.fetch<{ ok?: boolean; assinatura?: any }>(
      `/store/assinaturas/${id}/${nome}`,
      {
        method: "POST",
        headers: { ...authHeaders },
        cache: "no-store",
      }
    )
    if (d?.ok !== true) return { ok: false, erro: ERRO_GENERICO }
    const proxima = String(d.assinatura?.proxima_em || "").slice(0, 10)
    return proxima ? { ok: true, proxima_em: proxima } : { ok: true }
  } catch {
    return { ok: false, erro: ERRO_GENERICO }
  }
}

/**
 * Pular a PRÓXIMA entrega: o motor soma a frequência (a partir da data
 * programada; nunca pro passado) e fecha o ciclo pendente — o link mágico
 * antigo passa a levar pro painel.
 */
export async function pularProximaEntrega(id: string): Promise<ResultadoAcaoEP> {
  return acao(id, "pular")
}

/** Pausar: o motor para de gerar ciclos até reativar. Sem multa, sem prazo. */
export async function pausarEntregaProgramada(
  id: string
): Promise<ResultadoAcaoEP> {
  return acao(id, "pausar")
}

/**
 * Reativar uma pausada (rota 'retomar' do motor). Se a data programada ficou
 * no passado durante a pausa, o motor reprograma pra frente (nunca dispara na
 * hora).
 */
export async function reativarEntregaProgramada(
  id: string
): Promise<ResultadoAcaoEP> {
  return acao(id, "retomar")
}

/** Cancelar de vez (sem multa). Aderir de novo = pelo bloco de um pedido. */
export async function cancelarEntregaProgramada(
  id: string
): Promise<ResultadoAcaoEP> {
  return acao(id, "cancelar")
}
