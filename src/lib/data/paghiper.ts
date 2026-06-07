"use server"

import { sdk } from "@lib/config"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCacheTag } from "./cookies"

const PAGHIPER_PROVIDER = "pp_paghiper-boleto_paghiper-boleto"

/**
 * Emite o BOLETO PagHiper (#52) para o carrinho e devolve os dados do boleto.
 *
 * Espelha createPagbankPix: inicia a payment session do provider boleto (o
 * backend chama transaction/create na PagHiper) e re-busca a sessão pra ler o que
 * o provider gravou em `data` (linha digitável, código de barras, PDF, vencimento).
 *
 * O CPF/CNPJ é o do FATURAMENTO (já coletado na identificação). Boleto é "pague
 * depois": após emitir, o componente chama placeOrder() → o pedido nasce
 * "aguardando pagamento" (EMAIL 1 do #51).
 */
export async function createPagHiperBoleto(cartId: string, taxId: string) {
  const headers = { ...(await getAuthHeaders()) }

  const { cart } = await sdk.client.fetch<{ cart: any }>(
    `/store/carts/${cartId}`,
    { method: "GET", query: { fields: "id,email,*payment_collection" }, headers, cache: "no-store" }
  )

  await sdk.store.payment.initiatePaymentSession(
    cart as any,
    {
      provider_id: PAGHIPER_PROVIDER,
      data: {
        tax_id: taxId,
        session_id: cartId,
        email: (cart as any)?.email,
        // referência HUMANA estável pro boleto/e-mails da PagHiper (07/06):
        // o session_id é sobrescrito pelo Medusa com o payses_ técnico — o
        // cliente via isso como "número do pedido". CPM-<sufixo do cart>.
        referencia: `CPM-${String(cartId).slice(-6).toUpperCase()}`,
      },
    } as any,
    {},
    headers
  )

  const cartTag = await getCacheTag("carts")
  revalidateTag(cartTag)

  // re-busca pra pegar os dados do boleto gravados na sessão
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
    (x: any) => x.provider_id === PAGHIPER_PROVIDER
  )
  return {
    transaction_id: s?.data?.paghiper_transaction_id ?? null,
    linha_digitavel: s?.data?.linha_digitavel ?? null,
    codigo_barras: s?.data?.codigo_barras ?? null,
    pdf_url: s?.data?.pdf_url ?? null,
    url_slip: s?.data?.url_slip ?? null,
    vencimento: s?.data?.vencimento ?? null,
  }
}
