"use server"

import { sdk } from "@lib/config"
import { LOGIN_MIGRADO, SENHA_REDEFINIDA, TOKEN_EXPIRADO, CPF_JA_CADASTRADO, EMAIL_JA_CADASTRADO } from "@lib/util/migracao-constants"
import medusaError from "@lib/util/medusa-error"
import { isValidCpf, isValidCnpj, isValidCpfOrCnpj } from "@lib/util/cpf"
import { sanitizaEndereco } from "@lib/util/endereco"
import {
  validaTelefoneObrigatorio,
  validaTelefoneOpcional,
} from "@lib/util/telefone"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
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

    // Dado por-usuário mutável fora de banda (pedido anexado server-side:
    // recuperação PIX, GET/manual, Bling) → NÃO cachear. O force-cache guardava
    // *orders vazio e o painel sub-reportava pedidos do cliente (fix 02/07).
    return await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: {
          // metadata+phone: detecta migrado/celular_confirmado e mostra o número
          // atual na tela "Confirme seu WhatsApp" (migração, Marco 10/06).
          // ⚠️ fields explícito SUBSTITUI os defaults — por isso listamos também
          // first_name/last_name/email/company_name/*addresses; sem eles o customer
          // volta sem nome/email/endereços e quebra "Olá {nome}", o nav (vira
          // "Entrar" logado) e o .filter de addresses no checkout/perfil. Bug 17/06.
          // +created_at (Marco 18/06): "Cliente Copamar desde {ano}" no painel.
          fields: "*orders,*addresses,metadata,phone,first_name,last_name,email,company_name,created_at",
        },
        headers,
        cache: "no-store",
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
  // CPF/CNPJ no cadastro: valida o dígito verificador (rejeita lixo) e grava no
  // metadata. Casa o cliente com o Bling (histórico de pedidos) + pré-preenche a
  // nota fiscal no checkout (não re-pede no fim da compra). Valida SE veio (o
  // form de cadastro manda sempre; o fluxo de convidado/checkout passa o doc
  // fiscal já validado) — assim não quebra chamadas sem cpf.
  const cpfDigits = ((formData.get("cpf") as string) || "").replace(/\D/g, "")
  if (cpfDigits && !isValidCpfOrCnpj(cpfDigits)) {
    return "CPF/CNPJ inválido — confira os números."
  }
  // CPF/CNPJ JÁ cadastrado (cliente importado do site antigo, Marco 19/06): NÃO
  // cria conta nova — devolve o sentinela pra UI orientar a fazer login (lá cai
  // no fluxo de "definir nova senha"). Fail-open: se a checagem falhar, segue o
  // cadastro normal (o backend tem unicidade de e-mail como backstop).
  if (cpfDigits) {
    try {
      const chk = await sdk.client.fetch<{ existe: boolean }>(
        "/store/migracao/cpf-check",
        { method: "POST", body: { cpf: cpfDigits } }
      )
      if (chk?.existe) return CPF_JA_CADASTRADO
    } catch {}
  }
  const customerForm: Record<string, any> = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
    ...(cpfDigits ? { metadata: { cpf: cpfDigits } } : {}),
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
    // E-mail já tem conta (Marco 19/06): só quando o REGISTRO falhou
    // (registered=false) com erro de "já existe" — devolve o sentinela pra UI
    // mostrar "faça login" em vez do erro técnico ("identity already exists").
    const msg = String(error?.message || error)
    if (!registered && /exist|already|registered|identity/i.test(msg)) {
      return EMAIL_JA_CADASTRADO
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
  // Presença OBRIGATÓRIA — mesmo gate de setAddresses, só que ANTES do signup
  // pra não criar conta órfã quando o doc fiscal falta/está errado.
  if (!fiscalDocDigits) {
    return "Informe o CPF ou CNPJ para emitir a nota fiscal."
  }
  {
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

  // TELEFONE COM DDD (jul/26, QDB): pré-valida ANTES do signup pelo mesmo
  // motivo do doc fiscal acima — telefone inválido não pode criar conta órfã
  // (o reenvio corrigido cairia em "e-mail já existe"). Entrega é OBRIGATÓRIO
  // (caso Danielle: sem telefone o motorista não consegue ligar); cobrança
  // segue opcional. O `required`/`pattern` do input segura isso no client;
  // aqui é o backstop. setAddresses revalida depois.
  {
    const foneErr =
      validaTelefoneObrigatorio(
        String(formData.get("shipping_address.phone") || "")
      ) ||
      validaTelefoneOpcional(String(formData.get("billing_address.phone") || ""))
    if (foneErr) {
      return foneErr
    }
  }

  // TIPO DE LOCAL DE ENTREGA (jul/26): obrigatório no checkout — pré-valida
  // aqui também pra não criar conta órfã. setAddresses revalida como backstop.
  if (!String(formData.get("shipping_address.tipo_local") || "").trim()) {
    return "Escolha o tipo de local de entrega."
  }

  const accountPassword = ((formData.get("account_password") as string) || "").trim()
  if (accountPassword) {
    const signupForm = new FormData()
    signupForm.set("email", (formData.get("email") as string) || "")
    signupForm.set("first_name", (formData.get("shipping_address.first_name") as string) || "")
    signupForm.set("last_name", (formData.get("shipping_address.last_name") as string) || "")
    signupForm.set("phone", (formData.get("shipping_address.phone") as string) || "")
    signupForm.set("password", accountPassword)
    // doc fiscal já validado acima → grava como CPF/CNPJ no cadastro também
    signupForm.set("cpf", fiscalDocDigits)

    const res = await signup(null, signupForm)
    if (typeof res === "string") {
      // erro no registro → não prossegue pro próximo passo
      if (res === CPF_JA_CADASTRADO) {
        // CPF já tem conta (importada): não trava a COMPRA — orienta a logar ou
        // seguir como convidado (desmarcando "criar conta"). Dúvidas: telefone.
        return "Esse CPF já tem conta na Copamar. Faça login para usar sua conta, ou desmarque “criar conta” para seguir como convidado. Dúvidas: (11) 95205-0000."
      }
      return res === EMAIL_JA_CADASTRADO ||
        /exist|already|registered|identity/i.test(res)
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
    // MIGRAÇÃO (Marco 09/06): se a conta veio do site antigo e ainda não tem
    // senha definida, o backend dispara o e-mail de redefinição e a UI mostra
    // "trocamos de site" em vez de "senha inválida". Contas normais seguem o
    // fluxo de erro comum (a rota responde migrado:false).
    try {
      const r = await sdk.client.fetch<{ migrado: boolean }>(
        "/store/migracao/login-check",
        { method: "POST", body: { email } }
      )
      if (r?.migrado) return LOGIN_MIGRADO
    } catch {}
    const msg = String(error?.message || error)
    if (/invalid email or password/i.test(msg)) {
      return "E-mail ou senha incorretos — confira e tente de novo."
    }
    return msg.replace(/^Error:\s*/i, "")
  }

  // login OK → se era conta migrada, marca como reivindicada (sai do fluxo de
  // migração; erros de senha futuros voltam a ser erros normais)
  try {
    const headers = await getAuthHeaders()
    await sdk.client.fetch("/store/migracao/claimed", {
      method: "POST",
      headers,
    })
  } catch {}

  try {
    await transferCart()
  } catch (error: any) {
    return error.toString()
  }
}

/**
 * Conclui a redefinição de senha (migração/esqueci a senha): consome o token
 * do e-mail no endpoint core do Medusa. Retorna SENHA_REDEFINIDA ou mensagem
 * de erro em PT.
 */
export async function redefinirSenha(_state: unknown, formData: FormData) {
  const token = String(formData.get("token") || "")
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const password = String(formData.get("password") || "")
  const confirma = String(formData.get("password_confirm") || "")
  if (!token) return "Link inválido — abra o link mais recente do e-mail."
  if (password.length < 8) return "A senha precisa ter pelo menos 8 caracteres."
  if (password !== confirma) return "As senhas não conferem — digite a mesma senha nos dois campos."
  try {
    await sdk.client.fetch("/auth/customer/emailpass/update", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: { email, password },
    })
    // COSTURADO (Marco 10/06): loga automático com a senha recém-criada, pra
    // emendar direto na tela "Confirme seu WhatsApp" sem novo login manual.
    // Best-effort: se falhar, a pessoa só faz login normal (a tela aparece lá).
    try {
      const loginToken = await sdk.auth.login("customer", "emailpass", { email, password })
      await setAuthToken(loginToken as string)
      const tag = await getCacheTag("customers")
      revalidateTag(tag)
      const headers = await getAuthHeaders()
      await sdk.client.fetch("/store/migracao/claimed", { method: "POST", headers })
    } catch {}
    return SENHA_REDEFINIDA
  } catch (e: any) {
    const m = String(e?.message || e)
    if (/expired|invalid|unauthorized|401|jwt/i.test(m)) {
      // o core fixa o token em 15min — a UI oferece reenvio em 1 clique
      return TOKEN_EXPIRADO
    }
    return "Não foi possível redefinir agora — tente novamente em instantes."
  }
}

/** "Esqueci minha senha" manual (qualquer conta): dispara o e-mail de reset. */
export async function solicitarResetSenha(_state: unknown, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase()
  if (!email.includes("@")) return "Digite um e-mail válido."
  try {
    await sdk.client.fetch("/auth/customer/emailpass/reset-password", {
      method: "POST",
      body: { identifier: email },
    })
  } catch {}
  // resposta neutra de propósito (não revela se o e-mail tem cadastro)
  return "Se este e-mail tiver cadastro, você receberá o link de redefinição em instantes."
}

/**
 * Confirma/corrige o WhatsApp do cliente migrado (tela do 1º acesso, Marco
 * 10/06 — bug do autocomplete que "comia o último dígito" no site antigo).
 * O backend valida (11 díg com o 9) e propaga pro Bling. Retorna "OK" no
 * sucesso ou a mensagem de erro em PT.
 */
export async function confirmarCelular(_state: unknown, formData: FormData) {
  const phone = String(formData.get("phone") || "")
  try {
    const headers = await getAuthHeaders()
    const r = await sdk.client.fetch<{ ok: boolean; erro?: string }>(
      "/store/migracao/confirmar-celular",
      { method: "POST", headers, body: { phone } }
    )
    if (!r?.ok) return r?.erro || "Não foi possível salvar o número — confira e tente de novo."
  } catch (e: any) {
    return String(e?.message || e).replace(/^Error:\s*/i, "") ||
      "Não foi possível salvar o número agora."
  }
  const tag = await getCacheTag("customers")
  revalidateTag(tag)
  return "OK"
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

  const bairro = ((formData.get("bairro") as string) || "").trim()
  // conserta campos embaralhados (nº da rua no campo Endereço; apto no Número)
  const { logradouro, numero, complemento } = sanitizaEndereco({
    logradouro: (formData.get("address_1") as string) || "",
    numero: (formData.get("numero") as string) || "",
    complemento: (formData.get("address_2") as string) || "",
  })
  // Redesign QDB (jul/26): título vira o NOME do endereço salvo (address_name,
  // campo nativo do customer address no Medusa v2) + tipo de local no metadata
  // (chaves aditivas — bling-push continua lendo logradouro/numero/bairro).
  const titulo = ((formData.get("endereco_titulo") as string) || "").trim()
  const tipoLocal = ((formData.get("tipo_local") as string) || "").trim()
  // telefone com DDD quando preenchido (backstop do pattern client — jul/26)
  const foneErr = validaTelefoneOpcional((formData.get("phone") as string) || "")
  if (foneErr) {
    return { success: false, error: foneErr }
  }
  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    // address_1 = "logradouro, número" (display); metadata estruturado p/ Bling.
    address_1: numero ? `${logradouro}, ${numero}` : logradouro,
    address_2: complemento,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
    is_default_billing: isDefaultBilling,
    is_default_shipping: isDefaultShipping,
    address_name: titulo || undefined,
    metadata: { logradouro, numero, bairro, titulo, tipo_local: tipoLocal },
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

  const bairro = ((formData.get("bairro") as string) || "").trim()
  // conserta campos embaralhados (nº da rua no campo Endereço; apto no Número)
  const { logradouro, numero, complemento } = sanitizaEndereco({
    logradouro: (formData.get("address_1") as string) || "",
    numero: (formData.get("numero") as string) || "",
    complemento: (formData.get("address_2") as string) || "",
  })
  // título/tipo do redesign QDB (jul/26) — address_name nativo + metadata.
  // SÓ mexe quando o form ENVIA os campos (formData.has): o form de cobrança
  // do perfil (profile-billing-address) não os tem e não pode apagar o título
  // de quem salvou pelo form novo. `titulo || null` permite LIMPAR na edição.
  const temTitulo = formData.has("endereco_titulo")
  const temTipo = formData.has("tipo_local")
  const titulo = ((formData.get("endereco_titulo") as string) || "").trim()
  const tipoLocal = ((formData.get("tipo_local") as string) || "").trim()
  // telefone com DDD quando preenchido (backstop do pattern client — jul/26)
  const foneErr = validaTelefoneOpcional((formData.get("phone") as string) || "")
  if (foneErr) {
    return { success: false, error: foneErr }
  }
  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: numero ? `${logradouro}, ${numero}` : logradouro,
    address_2: complemento,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    ...(temTitulo ? { address_name: titulo || null } : {}),
    metadata: {
      logradouro,
      numero,
      bairro,
      ...(temTitulo ? { titulo } : {}),
      ...(temTipo ? { tipo_local: tipoLocal } : {}),
    },
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
