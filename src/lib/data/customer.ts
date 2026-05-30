"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { isValidCpf, isValidCnpj } from "@lib/util/cpf"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
} from "./cookies"
import { setAddresses } from "./cart"

export const retrieveCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const authHeaders = await getAuthHeaders()

    if (!authHeaders) return null

    const headers = {
      ...authHeaders,
    }

    const next = {
      ...(await getCacheOptions("customers")),
    }

    return await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: {
          fields: "*orders",
        },
        headers,
        next,
        cache: "force-cache",
      })
      .then(({ customer }) => customer)
      .catch(() => null)
  }

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag)

  return updateRes
}

export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
  }

  let registered = false
  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    await setAuthToken(token as string)
    registered = true

    const headers = {
      ...(await getAuthHeaders()),
    }

    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      headers
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })

    await setAuthToken(loginToken as string)

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    await transferCart()

    return createdCustomer
  } catch (error: any) {
    // Se já registramos o identity mas o create/login falhou, limpa o token pra
    // não deixar uma identidade órfã que bloqueia a próxima tentativa com o
    // mesmo e-mail (ela passaria a cair em "já existe" sem nunca ter conta).
    if (registered) {
      try {
        await removeAuthToken()
      } catch {}
    }
    return error.toString()
  }
}

/**
 * Action do passo de endereço do checkout. Se o cliente marcou "criar conta" e
 * informou senha (`account_password`), registra a conta ANTES de gravar o
 * endereço (reusa `signup`). Sem senha → segue como CONVIDADO (setAddresses
 * intacto). Erro no registro (ex.: e-mail já existe) aborta e mostra a mensagem.
 */
export async function signupAndSetAddress(
  currentState: unknown,
  formData: FormData
) {
  // Pré-valida o documento fiscal ANTES de criar a conta. Se o doc estiver
  // errado, abortamos aqui — assim não criamos uma conta órfã que faria o
  // reenvio (com o doc corrigido) cair em "e-mail já existe". setAddresses
  // revalida como backstop.
  const fiscalTipo =
    (formData.get("fiscal_tipo") as string) === "J" ? "J" : "F"
  const fiscalDocDigits = (
    (formData.get("fiscal_documento") as string) || ""
  ).replace(/\D/g, "")
  if (fiscalDocDigits) {
    const docOk =
      fiscalTipo === "J"
        ? isValidCnpj(fiscalDocDigits)
        : isValidCpf(fiscalDocDigits)
    if (!docOk) {
      return fiscalTipo === "J"
        ? "CNPJ inválido — confira os números para emitir a nota fiscal."
        : "CPF inválido — confira os números para emitir a nota fiscal."
    }
    if (
      fiscalTipo === "J" &&
      !((formData.get("fiscal_razao_social") as string) || "").trim()
    ) {
      return "Informe a razão social da empresa para a nota fiscal."
    }
  }

  const accountPassword = ((formData.get("account_password") as string) || "").trim()
  if (accountPassword) {
    const signupForm = new FormData()
    signupForm.set("email", (formData.get("email") as string) || "")
    signupForm.set("first_name", (formData.get("shipping_address.first_name") as string) || "")
    signupForm.set("last_name", (formData.get("shipping_address.last_name") as string) || "")
    signupForm.set("phone", (formData.get("shipping_address.phone") as string) || "")
    signupForm.set("password", accountPassword)

    const res = await signup(null, signupForm)
    if (typeof res === "string") {
      // erro no registro → não prossegue pro próximo passo
      return /exist|already|registered|identity/i.test(res)
        ? "Este e-mail já tem conta. Faça login ou siga sem criar conta (desmarque a opção)."
        : res
    }
  }
  // grava o endereço e avança (setAddresses faz o redirect ?step=delivery)
  return setAddresses(currentState, formData)
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    await sdk.auth
      .login("customer", "emailpass", { email, password })
      .then(async (token) => {
        await setAuthToken(token as string)
        const customerCacheTag = await getCacheTag("customers")
        revalidateTag(customerCacheTag)
      })
  } catch (error: any) {
    return error.toString()
  }

  try {
    await transferCart()
  } catch (error: any) {
    return error.toString()
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()

  await removeAuthToken()

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  await removeCartId()

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  redirect(`/${countryCode}/account`)
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = await getAuthHeaders()

  await sdk.store.cart.transferCart(cartId, {}, headers)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)
}

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const isDefaultBilling = (currentState.isDefaultBilling as boolean) || false
  const isDefaultShipping = (currentState.isDefaultShipping as boolean) || false

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
    is_default_billing: isDefaultBilling,
    is_default_shipping: isDefaultShipping,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async ({ customer }) => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId =
    (currentState.addressId as string) || (formData.get("addressId") as string)

  if (!addressId) {
    return { success: false, error: "ID do endereço é obrigatório" }
  }

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
  } as HttpTypes.StoreUpdateCustomerAddress

  const phone = formData.get("phone") as string

  if (phone) {
    address.phone = phone
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}
