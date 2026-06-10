"use server"

import { getRota, hojeBR, mensagemCliente } from "./dados"

const SUPA = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY

// Disparo de WhatsApp (Evolution, mesma infra da MAPA). Dois modos:
//  - SHADOW (true): manda TUDO pro número do Marco, com aviso de pra quem iria.
//  - LIVE   (true): manda pro cliente de verdade.
// Ambos false = não envia. Os clientes da rota são REAIS — shadow primeiro.
const WPP_URL = process.env.WHATSAPP_URL
const WPP_KEY = process.env.WHATSAPP_KEY
const SHADOW = process.env.ENTREGAS_WHATSAPP_SHADOW === "true"
const LIVE = process.env.ENTREGAS_WHATSAPP_LIVE === "true"
const SHADOW_NUM = process.env.ENTREGAS_SHADOW_NUMERO || ""

async function enviarWhatsApp(celularCliente: string | null | undefined, texto: string) {
  if (!WPP_URL || !WPP_KEY || !texto) return
  const cel = (celularCliente || "").replace(/\D/g, "")
  let number = ""
  let text = texto
  if (LIVE && cel) {
    number = cel.startsWith("55") ? cel : `55${cel}`
  } else if (SHADOW && SHADOW_NUM) {
    number = SHADOW_NUM
    text = `🔬 *SHADOW* — iria pro cliente ${celularCliente || "(sem celular)"}\n\n${texto}`
  } else {
    return // nenhum modo ligado
  }
  try {
    await fetch(WPP_URL, {
      method: "POST",
      headers: { apikey: WPP_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ number, text }),
    })
  } catch {
    /* não derruba a ação se o WhatsApp falhar */
  }
}

/**
 * Grava o status da entrega no Supabase (entregas_frota de hoje) — é o que faz a
 * MAPA saber o progresso real — e dispara o WhatsApp ao cliente (shadow/live).
 * Chamado pelo "Confirmar".
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
    // avisa o cliente (entregue/ausente/adiado) — shadow vai pro Marco
    await enviarWhatsApp(input.celular, mensagemCliente(input.status, input.nome_cliente))
    return { ok: r.ok }
  } catch {
    return { ok: false }
  }
}

/**
 * Avisa a rota de hoje que "sai pra entrega hoje" (ideia 1). Em SHADOW manda só
 * 1 exemplo pro Marco + o total que iria, pra não lotar o WhatsApp dele. Em LIVE
 * manda pra cada cliente pendente com celular.
 */
export async function avisarRotaSaiHoje(): Promise<{ enviados: number; total: number }> {
  const rota = await getRota()
  const alvos = rota.filter((p) => p.status === "pendente" && p.celular)
  if (LIVE) {
    for (const p of alvos) {
      await enviarWhatsApp(p.celular, mensagemCliente("sai_hoje", p.nome_cliente))
    }
    return { enviados: alvos.length, total: alvos.length }
  }
  // shadow: 1 exemplo + nota do volume
  const ex = alvos[0]
  if (ex) {
    await enviarWhatsApp(
      ex.celular,
      `${mensagemCliente("sai_hoje", ex.nome_cliente)}\n\n_(em produção, esta mensagem iria pra ${alvos.length} clientes da rota de hoje)_`
    )
  }
  return { enviados: ex ? 1 : 0, total: alvos.length }
}
