"use server"

import { sdk } from "@lib/config"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCacheTag } from "./cookies"

/**
 * Cashback Copamar — camada de dados do storefront (regras aprovadas pelo Marco,
 * imutáveis nesta build): 1% dos PRODUTOS pagos vira saldo; libera 15 dias após
 * o ENVIO; resgate cobre até 30% dos produtos da nova compra (nunca frete, nunca
 * 100%); não acumula com cupom manual (convive com PIX5); expira 60 dias após
 * liberar; kill-switch CASHBACK_ATIVO em copamar_kv (nasce DESLIGADO).
 *
 * CONTRATO com o backend (todas as contas moram NO SERVIDOR — o front só exibe;
 * rotas reais do backend, casadas na revisão 10/07):
 * - GET  /store/cashback/config                      (publishable key)
 *        → { ativo: boolean, percentual: number }
 * - GET  /store/cashback/saldo                       (autenticada)
 *        → { ativo: boolean, saldo_liberado: number, saldo_pendente: number,
 *            proximo_a_expirar: { valor: number, expira_em: string } | null }
 *          ativo=false (kill-switch OFF) → a UI esconde TUDO (nem card zerado).
 * - GET  /store/cashback/resgatar?cart_id=...        (autenticada)
 *        → { ativo, saldo_liberado, valor_resgatavel, aplicado }
 *          valor_resgatavel = min(saldo, 30% dos produtos) JÁ calculado lá;
 *          aplicado > 0 quando o carrinho já tem resgate em andamento.
 * - POST /store/cashback/resgatar  body { cart_id }  (autenticada)
 *        → { ok, aplicado, valor_aplicado, promo_code, saldo_liberado_restante }
 * - POST /store/cashback/remover   body { cart_id }  (autenticada) → desfaz
 *        (estorna o débito condicional e tira a promoção CASHBK-* do cart)
 *
 * Valores em REAIS (unidade da moeda, como o resto do Medusa v2 aqui).
 * TUDO fail-quiet: backend fora do ar / flag OFF / deslogado → null/erro amigável,
 * o site nunca quebra por causa do cashback.
 */

export type CashbackSaldo = {
  saldo_liberado: number
  proximo_a_expirar: { valor: number; expira_em: string } | null
}

export type CashbackResgate = {
  saldo_liberado: number
  valor_resgatavel: number
  aplicado: number
}

/** Saldo do cliente logado pro painel /account. null = deslogado/OFF/falha. */
export async function getCashbackSaldo(): Promise<CashbackSaldo | null> {
  const authHeaders = await getAuthHeaders()
  if (!("authorization" in authHeaders)) return null

  return await sdk.client
    .fetch<CashbackSaldo & { ativo?: boolean }>(`/store/cashback/saldo`, {
      method: "GET",
      headers: { ...authHeaders },
      // saldo muda fora de banda (liberação 15d, expiração, resgate) → sem cache
      cache: "no-store",
    })
    .then((d) =>
      // ativo === true OBRIGATÓRIO: com o kill-switch OFF o backend responde
      // zeros com ativo=false — sem este gate o card "R$ 0,00" apareceria
      // com o programa desligado (furo fechado na revisão 10/07)
      d?.ativo === true && typeof d?.saldo_liberado === "number"
        ? {
            saldo_liberado: d.saldo_liberado,
            proximo_a_expirar:
              d.proximo_a_expirar &&
              typeof d.proximo_a_expirar.valor === "number" &&
              d.proximo_a_expirar.valor > 0
                ? d.proximo_a_expirar
                : null,
          }
        : null
    )
    .catch(() => null)
}

/**
 * Quanto dá pra usar NESTE carrinho — o teto de 30% é conta do SERVIDOR
 * (regra aprovada: nunca calcular teto no client). null = sem box no checkout.
 */
export async function getCashbackResgate(
  cartId: string
): Promise<CashbackResgate | null> {
  const authHeaders = await getAuthHeaders()
  if (!("authorization" in authHeaders) || !cartId) return null

  return await sdk.client
    .fetch<CashbackResgate & { ativo?: boolean }>(`/store/cashback/resgatar`, {
      method: "GET",
      query: { cart_id: cartId },
      headers: { ...authHeaders },
      cache: "no-store",
    })
    .then((d) =>
      // flag OFF → o backend responde só { ativo: false } (sem números) e o
      // box do checkout some por inteiro
      d?.ativo === true &&
      typeof d?.saldo_liberado === "number" &&
      typeof d?.valor_resgatavel === "number"
        ? {
            saldo_liberado: d.saldo_liberado,
            valor_resgatavel: d.valor_resgatavel,
            aplicado: typeof d.aplicado === "number" ? d.aplicado : 0,
          }
        : null
    )
    .catch(() => null)
}

/** Aplica o resgate no carrinho (1 clique). O valor final vem do servidor. */
export async function aplicarCashback(
  cartId: string
): Promise<{ ok: boolean; aplicado?: number; erro?: string }> {
  const authHeaders = await getAuthHeaders()
  if (!("authorization" in authHeaders)) {
    return { ok: false, erro: "Entre na sua conta para usar o cashback." }
  }

  try {
    const d = await sdk.client.fetch<{
      ok?: boolean
      aplicado?: number
      valor_aplicado?: number
      message?: string
    }>(`/store/cashback/resgatar`, {
      method: "POST",
      body: { cart_id: cartId },
      headers: { ...authHeaders },
      cache: "no-store",
    })
    // o total do carrinho mudou → revalida pro checkout re-renderizar certo
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
    return { ok: true, aplicado: d?.aplicado ?? d?.valor_aplicado }
  } catch (e: any) {
    return {
      ok: false,
      erro:
        "Não deu para aplicar o cashback agora. Tente de novo em instantes.",
    }
  }
}

/** Desfaz o resgate aplicado no carrinho (estorna o débito + tira a promoção). */
export async function removerCashback(
  cartId: string
): Promise<{ ok: boolean; erro?: string }> {
  const authHeaders = await getAuthHeaders()
  if (!("authorization" in authHeaders)) return { ok: false }

  try {
    await sdk.client.fetch(`/store/cashback/remover`, {
      method: "POST",
      body: { cart_id: cartId },
      headers: { ...authHeaders },
      cache: "no-store",
    })
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
    return { ok: true }
  } catch {
    return {
      ok: false,
      erro: "Não deu para remover o cashback agora. Tente de novo.",
    }
  }
}

/**
 * Config (kill-switch CASHBACK_ATIVO + percentual) pra uso em SERVER components
 * (a página /cashback). Client components usam o proxy /api/cashback-config.
 * Fail-CLOSED: qualquer falha → { ativo: false } (o programa nasce desligado).
 */
export async function getCashbackConfig(): Promise<{
  ativo: boolean
  percentual: number
}> {
  const base = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  try {
    const r = await fetch(`${base}/store/cashback/config`, {
      headers: { "x-publishable-api-key": pk },
      cache: "no-store",
    })
    if (!r.ok) return { ativo: false, percentual: 1 }
    const d = await r.json()
    return {
      ativo: d?.ativo === true,
      percentual:
        typeof d?.percentual === "number" && d.percentual > 0
          ? d.percentual
          : 1,
    }
  } catch {
    return { ativo: false, percentual: 1 }
  }
}
