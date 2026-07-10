"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { isValidCpf, isValidCnpj } from "@lib/util/cpf"
import { sanitizaEndereco } from "@lib/util/endereco"
import {
  validaTelefoneObrigatorio,
  validaTelefoneOpcional,
  validaTelefoneEntrega,
} from "@lib/util/telefone"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
} from "./cookies"
import { getRegion } from "./regions"
import { getLocale } from "@lib/data/locale-actions"

/**
 * Retrieves a cart by its ID. If no ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to retrieve.
 * @returns The cart object if found, or null if not found.
 */
export async function retrieveCart(cartId?: string, fields?: string) {
  const id = cartId || (await getCartId())
  fields ??=
    "*items, *region, *items.product, *items.variant, *items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name"

  if (!id) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("carts")),
  }

  return await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
      method: "GET",
      query: {
        fields,
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ cart }: { cart: HttpTypes.StoreCart }) => cart)
    .catch(() => null)
}

export async function getOrSetCart(countryCode: string) {
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let cart = await retrieveCart(undefined, "id,region_id")

  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!cart) {
    const locale = await getLocale()
    const cartResp = await sdk.store.cart.create(
      { region_id: region.id, locale: locale || undefined },
      {},
      headers
    )
    cart = cartResp.cart

    await setCartId(cart.id)

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, data, {}, headers)
    .then(async ({ cart }: { cart: HttpTypes.StoreCart }) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)

      return cart
    })
    .catch(medusaError)
}

/**
 * Embalagem do pedido (Marco 08/06): "discreta" (padrão — caixa neutra, sem
 * indicar o conteúdo) ou "transparente" (R$0 de acréscimo). Guardado em
 * cart.metadata.embalagem; flui pro order.metadata e vira observação no Bling.
 */
export async function setEmbalagem(valor: "discreta" | "transparente") {
  const cartId = await getCartId()
  if (!cartId) return
  const existing = await retrieveCart(cartId).catch(() => null)
  await updateCart({
    metadata: { ...(existing?.metadata || {}), embalagem: valor },
  } as HttpTypes.StoreUpdateCart)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
}: {
  variantId: string
  quantity: number
  countryCode: string
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,
      },
      {},
      headers
    )
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .addShippingMethod(cartId, { option_id: shippingMethodId }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: HttpTypes.StoreInitializePaymentSession
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, headers)
    .then(async (resp) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return resp
    })
    .catch(medusaError)
}

export async function applyPromotions(codes: string[]) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, { promo_codes: codes }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

/**
 * 5% PIX de VERDADE (Marco 09/06): aplica/remove a promoção PIX5 conforme o
 * método de pagamento escolhido. Por ser promoção do Medusa, o desconto entra
 * no TOTAL do carrinho → QR PIX, resumo, pedido, e-mails e Bling ficam todos
 * consistentes (nada de desconto "só no marketing").
 */
export async function setDescontoPix(ativo: boolean) {
  const cartId = await getCartId()
  if (!cartId) return
  const cart = await retrieveCart(cartId, "id,*promotions")
  const codes: string[] = ((cart as any)?.promotions || [])
    .map((p: any) => p?.code)
    .filter((c: any): c is string => typeof c === "string" && !!c)
  // NÃO-CUMULATIVO (Marco 03/07, cupom ANIVER10): com CUPOM MANUAL no carrinho
  // o PIX5 automático não entra (e sai se já estava) — senão o aniversário de
  // 10% virava 15% no PIX. Cupom manual = qualquer código ≠ PIX5 — EXCETO o
  // resgate de cashback (CASHBK-*), que por regra aprovada CONVIVE com o PIX5
  // (sem esta exceção, usar o cashback derrubava os 5% do PIX — revisão 10/07).
  const temCupomManual = codes.some(
    (c) => c !== "PIX5" && !c.startsWith("CASHBK-")
  )
  const querPix5 = ativo && !temCupomManual
  const tem = codes.includes("PIX5")
  if (querPix5 === tem) return
  const novos = querPix5 ? [...codes, "PIX5"] : codes.filter((c) => c !== "PIX5")
  await applyPromotions(novos)
}

export async function applyGiftCard(code: string) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, { gift_cards: [{ code }] }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function removeDiscount(code: string) {
  // const cartId = getCartId()
  // if (!cartId) return "No cartId cookie found"
  // try {
  //   await deleteDiscount(cartId, code)
  //   revalidateTag("cart")
  // } catch (error: any) {
  //   throw error
  // }
}

export async function removeGiftCard(
  codeToRemove: string,
  giftCards: any[]
  // giftCards: GiftCard[]
) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, {
  //       gift_cards: [...giftCards]
  //         .filter((gc) => gc.code !== codeToRemove)
  //         .map((gc) => ({ code: gc.code })),
  //     }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function submitPromotionForm(
  currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
  } catch (e: any) {
    return e.message
  }
}

// TODO: Pass a POJO instead of a form entity here
/** Erros do passo de endereço em PT-BR (sem prefixo técnico em inglês). */
function traduzErroEndereco(msg: string): string {
  const m = (msg || "").toLowerCase()
  if (/cep|postal|fulfillment|shipping|frete|atende/.test(m)) {
    return "Não conseguimos calcular o frete para este CEP. Confira o CEP digitado e tente novamente."
  }
  if (/fetch failed|econnrefused|network|timeout|socket/.test(m)) {
    return "Falha de conexão ao salvar o endereço — tente novamente em instantes."
  }
  return (msg || "Não foi possível salvar o endereço — tente novamente.").replace(
    /^Error setting up the request:\s*/i,
    ""
  )
}

export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = await getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    // Monta o endereço a partir do form: address_1 = "logradouro, número" (display
    // em todo lugar), address_2 = complemento (ex. "apto 11"), e metadata
    // estruturado {logradouro, numero, bairro} que o bling-push usa pra montar o
    // endereço da NF-e (cobrança) e da etiqueta de entrega no Bling.
    const montaEndereco = (p: string) => {
      const bairro = String(formData.get(`${p}.bairro`) || "").trim()
      // conserta campos embaralhados (nº da rua no campo Endereço; apto no Número)
      const { logradouro, numero, complemento } = sanitizaEndereco({
        logradouro: String(formData.get(`${p}.address_1`) || ""),
        numero: String(formData.get(`${p}.numero`) || ""),
        complemento: String(formData.get(`${p}.address_2`) || ""),
      })
      // Redesign QDB (jul/26): título do endereço ("Casa da mãe") e tipo de
      // local (Apartamento/Comercial/…) viajam no metadata do address — fluem
      // pro pedido (logística/rota do Dedé). Chaves ADITIVAS: o bling-push
      // continua lendo só logradouro/numero/bairro. Sempre presentes (mesmo
      // vazias) pra sobrescrever valor antigo caso o metadata seja mesclado.
      const titulo = String(formData.get(`${p}.endereco_titulo`) || "").trim()
      const tipoLocal = String(formData.get(`${p}.tipo_local`) || "").trim()
      return {
        first_name: formData.get(`${p}.first_name`),
        last_name: formData.get(`${p}.last_name`),
        address_1: numero ? `${logradouro}, ${numero}` : logradouro,
        address_2: complemento,
        company: formData.get(`${p}.company`),
        postal_code: formData.get(`${p}.postal_code`),
        city: formData.get(`${p}.city`),
        country_code: formData.get(`${p}.country_code`),
        province: formData.get(`${p}.province`),
        phone: formData.get(`${p}.phone`),
        metadata: { logradouro, numero, bairro, titulo, tipo_local: tipoLocal },
      }
    }

    // TELEFONE DE ENTREGA OBRIGATÓRIO (jul/26, caso Danielle): pedido sem
    // telefone = entrega às cegas (motorista não consegue ligar). Entrega →
    // vazio NÃO passa + exige 10-11 dígitos com DDD (caso "998590034").
    // Cobrança segue OPCIONAL (preenchido → valida DDD; ausente por
    // same_as_billing vem null → "" → passa). Backstop autoritativo do
    // required/pattern client-side.
    const foneErr =
      validaTelefoneEntrega(
        String(formData.get("shipping_address.phone") || ""),
        formData.get("shipping_address.country_code")
      ) ||
      validaTelefoneOpcional(String(formData.get("billing_address.phone") || ""))
    if (foneErr) {
      return foneErr
    }

    // TIPO DE LOCAL DE ENTREGA OBRIGATÓRIO (jul/26): a logística (rota do
    // Dedé/etiqueta) precisa saber se é apartamento/condomínio/etc. Gate SÓ no
    // endereço de ENTREGA — cobrança e endereços da conta seguem opcionais.
    const tipoLocalEntrega = String(
      formData.get("shipping_address.tipo_local") || ""
    ).trim()
    if (!tipoLocalEntrega) {
      return "Escolha o tipo de local de entrega."
    }

    const data = {
      shipping_address: montaEndereco("shipping_address"),
      email: formData.get("email"),
    } as any

    const sameAsBilling = formData.get("same_as_billing")
    if (sameAsBilling === "on") data.billing_address = data.shipping_address
    if (sameAsBilling !== "on")
      data.billing_address = montaEndereco("billing_address")

    // IDENTIFICAÇÃO FISCAL (faturamento) — documento que vai pro contato Bling
    // (tipo F/J) + NF-e. É independente do documento do PAGADOR (titular do
    // cartão), que é capturado no passo de pagamento. PF = CPF; PJ = CNPJ +
    // razão social + IE (ou isento). Guardamos no metadata do carrinho; o
    // backend (bling-push) prioriza fiscal_documento.
    const onlyDigits = (v: any) =>
      typeof v === "string" ? v.replace(/\D/g, "") : ""
    const fiscalTipo =
      (formData.get("fiscal_tipo") as string) === "J" ? "J" : "F"
    const fiscalMeta: Record<string, any> = {
      fiscal_tipo: fiscalTipo,
      fiscal_documento: onlyDigits(formData.get("fiscal_documento")),
    }
    if (fiscalTipo === "J") {
      const isento =
        formData.get("fiscal_isento_ie") === "on" ||
        formData.get("fiscal_isento_ie") === "true"
      fiscalMeta.razao_social =
        (formData.get("fiscal_razao_social") as string) || ""
      fiscalMeta.isento_ie = isento ? "true" : "false"
      fiscalMeta.inscricao_estadual = isento
        ? ""
        : onlyDigits(formData.get("fiscal_ie"))
    } else {
      // PF — limpa campos de PJ pra não vazar de uma tentativa anterior
      fiscalMeta.razao_social = ""
      fiscalMeta.inscricao_estadual = ""
      fiscalMeta.isento_ie = "false"
    }
    // GATE FISCAL (servidor, autoritativo — o `required` do input é só client).
    // Presença é OBRIGATÓRIA: NF-e exige o documento do faturamento, e isso
    // impede o backend de cair no fallback do doc do PAGADOR (ver bling-push).
    if (!fiscalMeta.fiscal_documento) {
      return "Informe o CPF ou CNPJ para emitir a nota fiscal."
    }
    // documento inválido NÃO avança (DV do tipo certo).
    const docOk =
      fiscalTipo === "J"
        ? isValidCnpj(fiscalMeta.fiscal_documento)
        : isValidCpf(fiscalMeta.fiscal_documento)
    if (!docOk) {
      return fiscalTipo === "J"
        ? "CNPJ inválido — confira os números para emitir a nota fiscal."
        : "CPF inválido — confira os números para emitir a nota fiscal."
    }
    if (fiscalTipo === "J" && !fiscalMeta.razao_social) {
      return "Informe a razão social da empresa para a nota fiscal."
    }
    // Opt-in de marketing (#97) — checkbox DESMARCADO por padrão (LGPD). Persiste
    // no cart.metadata (flui pro order.metadata); o registro no n8n é feito na
    // página de confirmação (placeOrder faz redirect e mata código posterior).
    const marketingConsent = formData.get("marketing_consent") === "on"
    fiscalMeta.marketing_consent = marketingConsent ? "true" : "false"
    fiscalMeta.marketing_consent_ts = marketingConsent
      ? new Date().toISOString()
      : ""
    const existing = await retrieveCart(cartId, "id,metadata")
    data.metadata = { ...(existing?.metadata || {}), ...fiscalMeta }

    try {
      await updateCart(data)
    } catch (err: any) {
      // Trocar o CEP com um método de frete JÁ escolhido pode estourar o
      // recálculo (CEP fora da cobertura do método antigo) e travar o checkout
      // (Marco 09/06). Desgruda o método e tenta UMA vez de novo — a etapa de
      // entrega recalcula as opções válidas pro CEP novo.
      try {
        await sdk.client.fetch(`/store/carts/${cartId}/reset-shipping`, {
          method: "POST",
        })
        await updateCart(data)
      } catch (err2: any) {
        return traduzErroEndereco(err2?.message || err?.message || String(err))
      }
    }
  } catch (e: any) {
    return traduzErroEndereco(e.message)
  }

  redirect(
    `/${formData.get("shipping_address.country_code")}/checkout?step=delivery`
  )
}

/**
 * Places an order for a cart. If no cart ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to place an order for.
 * @returns The cart object if the order was successful, or null if not.
 */
export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  // GATE À PROVA DE ERROS (jul/26, Marco: celular obrigatório): revalida o
  // CELULAR de entrega no ÚLTIMO passo, lendo o CARRINHO REAL — assim pega
  // QUALQUER caminho que tenha deixado o telefone escapar dos gates de endereço
  // (autofill dessincronizado, endereço salvo sem celular, re-set no meio).
  // Nenhum pedido fecha sem celular válido. Falha de rede na leitura NÃO bloqueia
  // (os gates de setAddresses/signup já validaram); só o celular inválido barra.
  try {
    const { cart: cAtual } = await sdk.store.cart.retrieve(
      id,
      { fields: "id,shipping_address.phone,shipping_address.country_code" },
      headers
    )
    const foneErr = validaTelefoneEntrega(
      String((cAtual as any)?.shipping_address?.phone || ""),
      (cAtual as any)?.shipping_address?.country_code
    )
    if (foneErr) {
      const err: any = new Error(foneErr)
      err.telefoneInvalido = true // marca pra propagar (o componente mostra a msg)
      throw err
    }
  } catch (e: any) {
    // telefone inválido barra o pedido; falha de LEITURA (infra) segue —
    // os gates de setAddresses/signup já validaram o vazio no passo de endereço.
    if (e?.telefoneInvalido) throw e
  }

  const cartRes = await sdk.store.cart
    .complete(id, {}, headers)
    .then(async (cartRes) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return cartRes
    })
    .catch(medusaError)

  if (cartRes?.type === "order") {
    const countryCode =
      cartRes.order.shipping_address?.country_code?.toLowerCase()

    const orderCacheTag = await getCacheTag("orders")
    revalidateTag(orderCacheTag)

    removeCartId()
    redirect(`/${countryCode}/order/${cartRes?.order.id}/confirmed`)
  }

  return cartRes.cart
}

/**
 * Updates the countrycode param and revalidates the regions cache
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    await updateCart({ region_id: region.id })
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  const regionCacheTag = await getCacheTag("regions")
  revalidateTag(regionCacheTag)

  const productsCacheTag = await getCacheTag("products")
  revalidateTag(productsCacheTag)

  redirect(`/${countryCode}${currentPath}`)
}

export async function listCartOptions() {
  const cartId = await getCartId()
  const headers = {
    ...(await getAuthHeaders()),
  }
  const next = {
    ...(await getCacheOptions("shippingOptions")),
  }

  return await sdk.client.fetch<{
    shipping_options: HttpTypes.StoreCartShippingOption[]
  }>("/store/shipping-options", {
    query: { cart_id: cartId },
    next,
    headers,
    cache: "force-cache",
  })
}
