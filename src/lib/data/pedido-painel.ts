"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

/**
 * Painel do cliente (Marco 18/06) — consome as rotas backend ricas do pedido:
 *  - /store/orders/:id/painel → entrega (timeline+foto+recebedor), avaliação, NF disponível
 *  - /store/orders/:id/nfe    → link do DANFE (lazy, só ao clicar "baixar nota")
 * Ownership é checado no backend (o pedido tem que ser do cliente logado).
 */

export type EntregaRica = {
  status: string | null
  em_rota_em: string | null
  entregue_em: string | null
  recebedor: string | null
  tentativas: number
  foto_url: string | null
  frota_propria: boolean
} | null

export type PainelPedido = {
  display_id?: number
  created_at?: string
  entrega: EntregaRica
  avaliacao: { nota: number; respondido_em: string | null } | null
  nfe_disponivel: boolean
}

export async function getPainelPedido(orderId: string): Promise<PainelPedido | null> {
  try {
    const headers = { ...(await getAuthHeaders()) }
    return await sdk.client.fetch<PainelPedido>(`/store/orders/${orderId}/painel`, {
      method: "GET",
      headers,
      cache: "no-store",
    })
  } catch {
    return null
  }
}

export async function getNfeLink(orderId: string): Promise<string | null> {
  try {
    const headers = { ...(await getAuthHeaders()) }
    const r = await sdk.client.fetch<{ url: string }>(`/store/orders/${orderId}/nfe`, {
      method: "GET",
      headers,
      cache: "no-store",
    })
    return r?.url || null
  } catch {
    return null
  }
}
