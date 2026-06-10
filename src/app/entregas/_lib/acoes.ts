"use server"

import { hojeBR } from "./dados"

const SUPA = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY
// kill-switch do disparo de WhatsApp — OFF até o Marco aprovar (os clientes da
// rota são REAIS; ativar em shadow/validação antes do go-live).
const WPP_LIVE = process.env.ENTREGAS_WHATSAPP_LIVE === "true"

/**
 * Grava o status da entrega no Supabase (entregas_frota de hoje). É o que faz a
 * MAPA saber o progresso real ("estamos na nº X") e dispara o WhatsApp ao
 * cliente (quando ENTREGAS_WHATSAPP_LIVE=true). Chamado pelo "Confirmar".
 */
export async function registrarStatus(input: {
  numero_pedido: string
  status: "entregue" | "ausente" | "adiado"
  nome_cliente?: string | null
  celular?: string | null
}): Promise<{ ok: boolean }> {
  if (!SUPA || !KEY) return { ok: false }
  const agora = new Date().toISOString()
  const patch: Record<string, any> = {
    status: input.status,
    atualizado_em: agora,
    ultima_tentativa_em: agora,
  }
  if (input.status === "entregue") patch.entregue_em = agora

  try {
    const r = await fetch(
      `${SUPA}/rest/v1/entregas_frota?data_rota=eq.${hojeBR()}&numero_pedido=eq.${encodeURIComponent(
        input.numero_pedido
      )}`,
      {
        method: "PATCH",
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(patch),
      }
    )

    // WhatsApp ao cliente — PREPARADO; dispara só com ENTREGAS_WHATSAPP_LIVE=true.
    // Quando ligar: POST na Evolution (mesma infra da MAPA), em shadow primeiro.
    if (WPP_LIVE && input.celular) {
      // const texto = mensagemCliente(input.status, input.nome_cliente ?? undefined)
      // TODO go-live: enviar `texto` pra input.celular via Evolution/n8n
    }

    return { ok: r.ok }
  } catch {
    return { ok: false }
  }
}
