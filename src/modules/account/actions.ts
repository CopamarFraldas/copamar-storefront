"use server"

import { listOrders } from "@lib/data/orders"
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
  let destino = `/${countryCode}/cart`
  try {
    const orders = await listOrders(1)
    const order = orders?.[0]
    if (!order?.items?.length) {
      redirect(`/${countryCode}/account/orders`)
    }
    let adicionou = false
    for (const it of order.items as any[]) {
      const variantId = it?.variant_id || it?.variant?.id
      const qty = Math.max(1, Number(it?.quantity ?? 1))
      if (!variantId) continue
      try {
        await addToCart({ variantId, quantity: qty, countryCode })
        adicionou = true
      } catch {
        /* item indisponível/esgotado → pula, não trava a recompra */
      }
    }
    if (!adicionou) destino = `/${countryCode}/account/orders`
  } catch {
    destino = `/${countryCode}/account/orders`
  }
  redirect(destino)
}
