import { HttpTypes } from "@medusajs/types"

/**
 * Próximo passo do checkout a partir do estado do carrinho. Usado pelo botão
 * do resumo e pela barra fixa mobile (fonte única — evita divergência).
 */
export function getCheckoutStep(cart: HttpTypes.StoreCart): string {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}
