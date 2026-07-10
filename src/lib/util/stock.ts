import { HttpTypes } from "@medusajs/types"

/**
 * Considera o produto esgotado quando TODAS as variants:
 *  - têm manage_inventory ativo,
 *  - não permitem backorder,
 *  - e têm inventory_quantity == 0.
 * Se houver pelo menos 1 variant disponível, produto NÃO está esgotado.
 */
export function isProductOutOfStock(product: HttpTypes.StoreProduct): boolean {
  const variants = (product.variants || []) as any[]
  if (!variants.length) return false
  return variants.every((v) => {
    if (!v.manage_inventory) return false
    if (v.allow_backorder) return false
    return (v.inventory_quantity || 0) <= 0 // <=0: estoque negativo também é esgotado
  })
}

/**
 * Unidades restantes da variante MAIS disponível — pro selo "Últimas N
 * unidades" do card. Urgência FACTUAL: retorna null (sem selo) quando
 * qualquer variant não controla estoque ou aceita backorder (estoque
 * efetivamente ilimitado/desconhecido), quando o campo inventory_quantity
 * não veio na query (gotcha do `fields` explícito) ou quando está esgotado.
 */
export function unidadesRestantes(product: HttpTypes.StoreProduct): number | null {
  const variants = (product.variants || []) as any[]
  if (!variants.length) return null
  // alguma variant sem controle de estoque/com backorder → não dá pra afirmar escassez
  if (variants.some((v) => !v.manage_inventory || v.allow_backorder)) return null
  // campo ausente na resposta → não confiar (senão viraria "Últimas 0")
  if (variants.some((v) => typeof v.inventory_quantity !== "number")) return null
  const max = Math.max(...variants.map((v) => v.inventory_quantity as number))
  return max > 0 ? max : null
}

/** Texto opcional do admin pra mostrar abaixo do selo de esgotado. */
export function avisoEstoque(product: HttpTypes.StoreProduct): string | null {
  const meta = (product.metadata || {}) as Record<string, any>
  const v = meta.aviso_estoque
  return typeof v === "string" && v.trim() ? v.trim() : null
}
