"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { HttpTypes } from "@medusajs/types"

export const listCartPaymentMethods = async (regionId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("payment_providers")),
  }

  return sdk.client
    .fetch<HttpTypes.StorePaymentProviderListResponse>(
      `/store/payment-providers`,
      {
        method: "GET",
        query: { region_id: regionId },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ payment_providers }) =>
      payment_providers
        // "Pagamento manual" (pp_system_default) é ferramenta de teste do
        // Medusa — nunca mostrar pro cliente (Marco 09/06). Pra reabilitar em
        // staging: NEXT_PUBLIC_SHOW_MANUAL_PAYMENT=true.
        .filter(
          (p) =>
            p.id !== "pp_system_default" ||
            process.env.NEXT_PUBLIC_SHOW_MANUAL_PAYMENT === "true"
        )
        .sort((a, b) => {
          return a.id > b.id ? 1 : -1
        })
    )
    .catch(() => {
      return null
    })
}
