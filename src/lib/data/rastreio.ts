"use server"

const SUPA = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY

/**
 * Rastreio do pedido (#164) — lê a linha de `pedidos_rastreio` (Supabase) por
 * id_bling (= order.metadata.bling_order_id). Essa tabela é mantida viva pela
 * esteira n8n (Fase 1/2/3). "Aguardando" = ainda sem etiqueta → tratado como
 * null (mostra "preparando"). Server-only (usa SUPABASE_SERVICE_KEY).
 */
export async function getRastreio(blingOrderId?: string | number | null) {
  if (!blingOrderId || !SUPA || !KEY) return null
  try {
    const r = await fetch(
      `${SUPA}/rest/v1/pedidos_rastreio?id_bling=eq.${encodeURIComponent(
        String(blingOrderId)
      )}&select=codigo_rastreio,codigo_servico,status_atual,entregue,entregue_em&limit=1`,
      {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
        cache: "no-store",
      }
    )
    if (!r.ok) return null
    const rows = await r.json()
    const row = Array.isArray(rows) ? rows[0] : null
    if (!row) return null
    const semAguardando = (v: any) =>
      v && String(v) !== "Aguardando" ? String(v) : null
    return {
      codigo: semAguardando(row.codigo_rastreio),
      transportadora: semAguardando(row.codigo_servico),
      status: row.status_atual ? String(row.status_atual) : null,
      entregue: !!row.entregue,
      entregueEm: row.entregue_em ? String(row.entregue_em) : null,
    }
  } catch {
    return null
  }
}
