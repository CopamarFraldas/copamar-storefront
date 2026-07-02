"use server"

import { listOrders, retrieveOrder } from "@lib/data/orders"
import { addToCart } from "@lib/data/cart"
import { redirect } from "next/navigation"

/**
 * Recompra de 1 clique ("Comprar de novo") — fralda é compra RECORRENTE/mensal,
 * então repor o último pedido em 1 toque é o que mais converte (Amazon abre em
 * cima disso). Pega o último pedido, adiciona os itens ao carrinho (pula o que
 * estiver indisponível, sem travar) e leva pro /cart.
 */
export async function reorderLastOrder(formData: FormData) {
  const countryCode = String(formData.get("countryCode") || "br")
  let adicionados = 0
  let total = 0
  try {
    const orders = await listOrders(1)
    const order = orders?.[0]
    if (order?.items?.length) {
      total = order.items.length
      for (const it of order.items as any[]) {
        const variantId = it?.variant_id || it?.variant?.id
        const qty = Math.max(1, Number(it?.quantity ?? 1))
        if (!variantId) continue
        try {
          // PREÇO ATUAL: passamos só variante + quantidade; o carrinho recalcula
          // com o preço VIGENTE (nunca o unit_price antigo do pedido), então
          // promoção/ajuste atual entra junto.
          await addToCart({ variantId, quantity: qty, countryCode })
          adicionados++
        } catch {
          /* indisponível/esgotado/descontinuado → pula, não quebra a recompra */
        }
      }
    }
  } catch {
    /* falha ao ler pedidos → cai no redirect pra /orders abaixo */
  }

  // nada adicionado (sem pedido, ou tudo indisponível) → pros pedidos
  if (adicionados === 0) {
    redirect(`/${countryCode}/account/orders?recompra=vazia`)
  }
  // feedback no carrinho: "X de Y itens adicionados"
  redirect(`/${countryCode}/cart?recompra=${adicionados}&de=${total}`)
}

/**
 * Recompra de UM pedido específico (botão "Repetir este pedido" na página do
 * pedido) — mesma lógica do reorderLastOrder, mas pelo order_id do formulário.
 */
export async function reorderOrder(formData: FormData) {
  const countryCode = String(formData.get("countryCode") || "br")
  const orderId = String(formData.get("order_id") || "")
  let adicionados = 0
  let total = 0
  try {
    const order = orderId ? await retrieveOrder(orderId) : null
    if (order?.items?.length) {
      total = order.items.length
      for (const it of order.items as any[]) {
        const variantId = it?.variant_id || it?.variant?.id
        const qty = Math.max(1, Number(it?.quantity ?? 1))
        if (!variantId) continue
        try {
          await addToCart({ variantId, quantity: qty, countryCode })
          adicionados++
        } catch {
          /* indisponível → pula */
        }
      }
    }
  } catch {
    /* segue pro redirect */
  }
  if (adicionados === 0) {
    redirect(`/${countryCode}/account/orders?recompra=vazia`)
  }
  redirect(`/${countryCode}/cart?recompra=${adicionados}&de=${total}`)
}
