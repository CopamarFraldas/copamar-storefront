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
    return (v.inventory_quantity || 0) === 0
  })
}

/** Texto opcional do admin pra mostrar abaixo do selo de esgotado. */
export function avisoEstoque(product: HttpTypes.StoreProduct): string | null {
  const meta = (product.metadata || {}) as Record<string, any>
  const v = meta.aviso_estoque
  return typeof v === "string" && v.trim() ? v.trim() : null
}
