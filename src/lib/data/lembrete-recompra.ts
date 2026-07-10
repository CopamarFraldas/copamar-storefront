"use server"

import { retrieveOrder } from "./orders"

/**
 * "Me lembre de repor" — agenda um lembrete de recompra no Supabase
 * (tabela lembretes_recompra). O script do servidor (lembrete-recompra.py)
 * varre a tabela, gera o link mágico (ver @lib/util/recompra-token) e manda o
 * WhatsApp via fila_whatsapp quando chega a data_alvo.
 *
 * SEGURANÇA: roda 100% server-side com a SERVICE KEY do Supabase (env, nunca
 * NEXT_PUBLIC_). O client só manda orderId + dias — celular, e-mail e itens são
 * relidos DO PEDIDO no Medusa (nada de confiar em dado vindo do browser).
 *
 * SHAPE DA LINHA (contrato com a DDL do agente do servidor):
 *   order_display_id bigint UNIQUE  ← chave do upsert (reescolher dias atualiza)
 *   order_id         text           ← id interno Medusa (order_01...)
 *   celular          text           ← SÓ DÍGITOS (mesma normalização do token)
 *   email            text
 *   itens            jsonb          ← [{variant_id, quantity, titulo}] snapshot
 *   dias             int            ← 15 | 20 | 30 | 45
 *   data_alvo        date           ← hoje (BR) + dias
 *   status           text           ← 'agendado' (script evolui: enviado/…)
 *   criado_em        timestamptz default now() (não enviamos — DDL cuida)
 */

const SUPA = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY

const DIAS_VALIDOS = [15, 20, 30, 45]

/** data de hoje no fuso BR (UTC-3) + N dias → YYYY-MM-DD */
function dataAlvoBR(dias: number): string {
  return new Date(Date.now() - 3 * 3600 * 1000 + dias * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10)
}

export type ResultadoLembrete =
  | { ok: true; dias: number }
  | { ok: false; erro: string }

export async function agendarLembreteRecompra(
  orderId: string,
  dias: number
): Promise<ResultadoLembrete> {
  try {
    if (!DIAS_VALIDOS.includes(Number(dias))) {
      return { ok: false, erro: "Escolha 15, 20, 30 ou 45 dias." }
    }
    if (!SUPA || !KEY) {
      return { ok: false, erro: "Lembrete indisponível agora." }
    }

    // relê o pedido no Medusa — fonte da verdade de celular/email/itens
    const order = await retrieveOrder(String(orderId || "")).catch(() => null)
    if (!order) {
      return { ok: false, erro: "Não encontramos esse pedido." }
    }

    const celular = String(
      order.shipping_address?.phone ||
        order.billing_address?.phone ||
        (order as any).customer?.phone ||
        ""
    ).replace(/\D/g, "")
    // sem celular não tem como mandar WhatsApp (a UI já esconde o bloco; isto
    // é o backstop server-side)
    if (celular.length < 10) {
      return { ok: false, erro: "Esse pedido não tem celular cadastrado." }
    }

    // snapshot dos itens — é o que a rota /recompra usa pra montar o carrinho
    // (o preço NÃO entra: a recompra re-preça com o valor vigente do Medusa)
    const itens = ((order.items as any[]) || [])
      .map((it) => ({
        variant_id: it?.variant_id || it?.variant?.id || null,
        quantity: Math.max(1, Number(it?.quantity ?? 1)),
        titulo: [it?.product_title, it?.title].filter(Boolean).join(" — "),
      }))
      .filter((it) => !!it.variant_id)
    if (!itens.length) {
      return { ok: false, erro: "Esse pedido não tem itens pra repor." }
    }

    const res = await fetch(
      `${SUPA}/rest/v1/lembretes_recompra?on_conflict=order_display_id`,
      {
        method: "POST",
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json",
          // upsert: clicar de novo (ou trocar os dias) ATUALIZA a linha do
          // pedido em vez de duplicar — e volta o status pra 'agendado'
          Prefer: "return=minimal,resolution=merge-duplicates",
        },
        body: JSON.stringify({
          order_display_id: Number(order.display_id),
          order_id: order.id,
          celular,
          email: order.email || null,
          itens,
          dias: Number(dias),
          data_alvo: dataAlvoBR(Number(dias)),
          status: "agendado",
        }),
        cache: "no-store",
      }
    )
    if (!res.ok) {
      return { ok: false, erro: "Não conseguimos agendar agora." }
    }
    return { ok: true, dias: Number(dias) }
  } catch {
    return { ok: false, erro: "Não conseguimos agendar agora." }
  }
}
