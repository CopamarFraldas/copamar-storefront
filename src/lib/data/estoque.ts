"use server"

import { getCartId, getAuthHeaders } from "./cookies"

/**
 * Validação de estoque PRÉ-PAGAMENTO (#46 anti-oversell, a camada que faltava):
 * o Medusa valida estoque no add/update do carrinho e no complete do pedido —
 * MAS nos fluxos reais (PagBank cartão/PIX, PagHiper boleto) o pagamento é
 * capturado ANTES do complete. Sem este gate, numa corrida (estoque caiu via
 * sync do Bling com item já no carrinho) o cliente seria COBRADO e o pedido
 * falharia depois. Aqui checamos o saldo FRESCO (no-store) antes de capturar.
 *
 * Retorna { ok: true } ou { ok: false, mensagem } amigável em PT-BR.
 */
/**
 * Saldos disponíveis por variant (#46): usado pelo carrinho pra LIMITAR o
 * seletor de quantidade ao saldo real (o starter tinha maxQuantity=10 fixo).
 * no-store: saldo fresco a cada render do carrinho. Falha → {} (o seletor
 * volta ao comportamento antigo; backend continua validando).
 */
export async function saldosPorVariant(
  productIds: string[]
): Promise<Record<string, number>> {
  const backend = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  const ids = Array.from(new Set(productIds.filter(Boolean)))
  if (!ids.length) return {}
  try {
    const qs = ids.map((id) => `id[]=${encodeURIComponent(id)}`).join("&")
    // GOTCHA: o "+" dos fields PRECISA ir encodado (%2B) — cru, o servidor
    // decodifica como espaço e ignora o campo (inventory viria undefined)
    const fields = encodeURIComponent(
      "id,*variants.id,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder"
    )
    const r = await fetch(`${backend}/store/products?${qs}&limit=${ids.length}&fields=${fields}`, {
      headers: { "x-publishable-api-key": pk },
      cache: "no-store",
      // deadline (review 06/06): sem timeout, backend travado seguraria o
      // render da página /cart inteira — melhor cair rápido no fallback {}
      signal: AbortSignal.timeout(2_500),
    })
    if (!r.ok) return {}
    const products: any[] = (await r.json()).products ?? []
    const out: Record<string, number> = {}
    for (const p of products) {
      for (const v of p.variants ?? []) {
        if (v.manage_inventory && !v.allow_backorder) {
          out[v.id] = Math.max(0, Number(v.inventory_quantity ?? 0))
        }
      }
    }
    return out
  } catch {
    return {}
  }
}

export async function validarEstoqueCarrinho(): Promise<
  { ok: true } | { ok: false; mensagem: string }
> {
  const backend = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

  try {
    const cartId = await getCartId()
    if (!cartId) return { ok: true } // sem carrinho → nada a validar

    const headers: Record<string, string> = {
      "x-publishable-api-key": pk,
      ...((await getAuthHeaders()) as any),
    }

    // itens do carrinho (variant + quantidade)
    const rc = await fetch(`${backend}/store/carts/${cartId}`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(6_000),
    })
    if (!rc.ok) return { ok: true } // indisponível → não bloqueia (complete ainda valida)
    const cart = (await rc.json()).cart
    const items: any[] = cart?.items ?? []
    if (!items.length) return { ok: true }

    // saldos FRESCOS via /store/products (inventory_quantity é computed lá)
    const productIds = Array.from(new Set(items.map((i) => i.product_id).filter(Boolean)))
    const qs = productIds.map((id) => `id[]=${encodeURIComponent(id)}`).join("&")
    // GOTCHA: "+" dos fields encodado (%2B) — cru vira espaço e o campo é ignorado
    const fields = encodeURIComponent(
      "id,title,*variants.id,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder"
    )
    const rp = await fetch(
      `${backend}/store/products?${qs}&limit=${productIds.length}&fields=${fields}`,
      { headers, cache: "no-store", signal: AbortSignal.timeout(6_000) }
    )
    if (!rp.ok) return { ok: true }
    const products: any[] = (await rp.json()).products ?? []

    const variantById = new Map<string, any>()
    for (const p of products) for (const v of p.variants ?? []) variantById.set(v.id, v)

    const problemas: string[] = []
    for (const item of items) {
      const v = variantById.get(item.variant_id)
      // variant NÃO voltou no /store/products = produto saiu do ar
      // (soft-delete/draft) com o item ainda no carrinho — vender seria
      // oversell garantido; bloqueia explicitamente (review 06/06: antes era
      // um continue silencioso = fail-open no caso de MAIOR risco)
      if (!v) {
        problemas.push(
          `“${item.product_title ?? item.title}” não está mais disponível na loja — remova do carrinho`
        )
        continue
      }
      if (!v.manage_inventory || v.allow_backorder) continue
      const disponivel = Math.max(0, Number(v.inventory_quantity ?? 0))
      if (item.quantity > disponivel) {
        problemas.push(
          disponivel === 0
            ? `“${item.product_title ?? item.title}” acabou de esgotar`
            : `“${item.product_title ?? item.title}” tem só ${disponivel} unidade(s) disponível(is) — você pediu ${item.quantity}`
        )
      }
    }

    if (problemas.length) {
      return {
        ok: false,
        mensagem:
          `${problemas.join("; ")}. ` +
          `Outro cliente pode ter comprado agora há pouco — ajuste a quantidade no carrinho e tente de novo. Nada foi cobrado.`,
      }
    }
    return { ok: true }
  } catch {
    // erro inesperado → não bloqueia o checkout (o complete do Medusa ainda
    // valida estoque; este gate é a camada extra, não a única)
    return { ok: true }
  }
}
