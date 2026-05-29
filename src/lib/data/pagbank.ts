"use server"

import { sdk } from "@lib/config"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCacheTag } from "./cookies"

/**
 * Cria a sessão PIX no PagBank (precisa do CPF) e retorna o QR.
 * O número do cartão NUNCA passa por aqui — isto é só PIX.
 */
export async function createPagbankPix(cartId: string, taxId: string) {
  const headers = { ...(await getAuthHeaders()) }

  const { cart } = await sdk.client.fetch<{ cart: any }>(
    `/store/carts/${cartId}`,
    { method: "GET", query: { fields: "id,*payment_collection" }, headers, cache: "no-store" }
  )

  await sdk.store.payment.initiatePaymentSession(
    cart as any,
    {
      provider_id: "pp_pagbank_pagbank",
      data: { tax_id: taxId, session_id: cartId },
    } as any,
    {},
    headers
  )

  const cartTag = await getCacheTag("carts")
  revalidateTag(cartTag)

  // re-busca pra pegar o QR + order id gravados na sessão
  const { cart: c2 } = await sdk.client.fetch<{ cart: any }>(
    `/store/carts/${cartId}`,
    {
      method: "GET",
      query: {
        fields:
          "id,payment_collection.payment_sessions.provider_id,payment_collection.payment_sessions.data",
      },
      headers,
      cache: "no-store",
    }
  )
  const s = (c2?.payment_collection?.payment_sessions ?? []).find(
    (x: any) => x.provider_id === "pp_pagbank_pagbank"
  )
  return {
    order_id: s?.data?.pagbank_order_id ?? null,
    qr_text: s?.data?.qr_text ?? null,
    qr_image: s?.data?.qr_image ?? null,
  }
}

/** Consulta ao vivo se o PIX foi pago (rota backend que tem o token PagBank). */
export async function checkPagbankStatus(orderId: string) {
  const headers = { ...(await getAuthHeaders()) }
  return await sdk.client.fetch<{ paid: boolean; status: string }>(
    `/store/pagbank/status`,
    { method: "GET", query: { order_id: orderId }, headers, cache: "no-store" }
  )
}
