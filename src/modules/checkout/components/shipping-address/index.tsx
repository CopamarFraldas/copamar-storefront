import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import EnderecoCampos from "@modules/common/components/endereco-campos"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useRef, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"
import { useCepEndereco } from "@lib/hooks/use-cep-endereco"
import {
  maskTelefoneBr,
  telefoneDigits,
  TELEFONE_MSG,
  TELEFONE_OBRIGATORIO_MSG,
  PAISES_TELEFONE,
} from "@lib/util/telefone"
import { derivaEndereco } from "@lib/util/endereco"

/**
 * Passo de endereço do checkout — redesign "Quem Disse Berenice" (jul/26):
 * pessoais primeiro (Nome, Sobrenome, CPF/NF via fiscalSlot, Telefone com
 * máscara, E-mail), depois Título do endereço + Tipo de local + CEP; os campos
 * de endereço só aparecem depois do CEP (preenchidos pelo ViaCEP e travados,
 * foco no Número). Endereço JÁ EXISTENTE no carrinho ou selecionado no
 * AddressSelect NÃO passa pelo fluxo progressivo (aparece completo/editável).
 * Os names dos inputs são os MESMOS de sempre — setAddresses/bling-push intactos.
 */
const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
  fiscalSlot,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
  /** bloco "Dados para a nota fiscal" (CPF/CNPJ) — renderiza entre Sobrenome e
   *  Telefone (ordem QDB), continuando dentro do MESMO <form>/FormData */
  fiscalSlot?: React.ReactNode
}) => {
  const sa: any = cart?.shipping_address || {}
  const saE = derivaEndereco(sa) // novo (metadata) OU migrado (address_1 mushed + bairro no address_2)
  const saMd = (sa.metadata || {}) as Record<string, any>
  const [formData, setFormData] = useState<Record<string, any>>({
    "shipping_address.first_name": sa.first_name || "",
    "shipping_address.last_name": sa.last_name || "",
    // address_1 mostra só o LOGRADOURO (rua); número/bairro/complemento têm campo próprio.
    "shipping_address.address_1": saE.logradouro,
    "shipping_address.numero": saE.numero,
    "shipping_address.bairro": saE.bairro,
    "shipping_address.address_2": saE.complemento,
    "shipping_address.company": sa.company || "",
    "shipping_address.postal_code": sa.postal_code || "",
    "shipping_address.city": sa.city || "",
    "shipping_address.country_code": sa.country_code || "",
    "shipping_address.province": sa.province || "",
    // telefone entra já mascarado — a máscara também normaliza legado sem formato
    "shipping_address.phone": maskTelefoneBr(sa.phone || ""),
    // título do endereço + tipo de local (QDB itens 7/8) — viajam no metadata
    "shipping_address.endereco_titulo": String(saMd.titulo || ""),
    "shipping_address.tipo_local": String(saMd.tipo_local || ""),
    email: cart?.email || "",
  })

  // Fluxo progressivo por CEP: SÓ pra endereço novo. Carrinho que já tem
  // endereço (voltou pra editar / migrado) entra em modo completo.
  const cepCtl = useCepEndereco({
    completoInicial: !!(sa.postal_code || sa.address_1),
    aplicar: (r) =>
      setFormData((prev: Record<string, any>) => ({
        ...prev,
        "shipping_address.address_1":
          r.logradouro || prev["shipping_address.address_1"],
        "shipping_address.bairro": r.bairro || prev["shipping_address.bairro"],
        "shipping_address.city": r.localidade || prev["shipping_address.city"],
        "shipping_address.province": r.uf || prev["shipping_address.province"],
        "shipping_address.country_code":
          prev["shipping_address.country_code"] || "br",
      })),
  })

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  // check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    if (address) {
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": derivaEndereco(address).logradouro,
        "shipping_address.numero": derivaEndereco(address).numero,
        "shipping_address.bairro": derivaEndereco(address).bairro,
        "shipping_address.address_2": derivaEndereco(address).complemento,
        "shipping_address.company": address?.company || "",
        "shipping_address.postal_code": address?.postal_code || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code": address?.country_code || "",
        "shipping_address.province": address?.province || "",
        "shipping_address.phone": maskTelefoneBr(address?.phone || ""),
        // endereço salvo da conta traz address_name; carrinho traz metadata.titulo
        "shipping_address.endereco_titulo": String(
          (address as any)?.address_name ||
            (address?.metadata as any)?.titulo ||
            ""
        ),
        "shipping_address.tipo_local": String(
          (address?.metadata as any)?.tipo_local || ""
        ),
      }))
      // endereço salvo/selecionado NÃO passa pelo fluxo progressivo: mostra
      // tudo preenchido e editável, como sempre foi (guarda-rail do redesign)
      if (address.postal_code || address.address_1) {
        cepCtl.marcarCompleto()
      }
    }

    email &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        email: email,
      }))
  }

  useEffect(() => {
    // Ensure cart is not null and has a shipping_address before setting form data
    if (cart && cart.shipping_address) {
      setFormAddress(cart?.shipping_address, cart?.email)
    }

    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]) // Add cart as a dependency

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // usado pelo EnderecoCampos (título/tipo/cep/rua/número/bairro/compl/cidade/uf)
  const setCampo = (nomeInput: string, valor: string) =>
    setFormData((prev: Record<string, any>) => ({ ...prev, [nomeInput]: valor }))

  // opção de criar conta (define senha) durante o checkout — só p/ não logado
  const [createAccount, setCreateAccount] = useState(false)

  // Seletor de PAÍS do telefone (jul/26 — comprador de fora recebe os avisos por
  // WhatsApp no número dele). Padrão Brasil; Brasil segue 100% igual (máscara BR
  // no próprio campo phone). Não-Brasil: guarda "+<ddi><dígitos>" no phone e o
  // servidor auto-detecta pelo "+". Detecta o país inicial pelo valor salvo.
  const [paisTel, setPaisTel] = useState<string>(() => {
    const p = String(sa.phone || "")
    const achou = p.startsWith("+")
      ? PAISES_TELEFONE.find(
          (x) => x.code !== "BR" && p.replace(/\D/g, "").startsWith(x.ddi)
        )
      : null
    return achou?.code || "BR"
  })
  const ddiAtual =
    PAISES_TELEFONE.find((p) => p.code === paisTel)?.ddi || "55"

  // dígitos NACIONAIS atuais (sem o código do país), pra remontar ao trocar país
  const digitosNacionais = (): string =>
    paisTel === "BR"
      ? telefoneDigits(formData["shipping_address.phone"] || "")
      : (formData["shipping_address.phone"] || "")
          .replace(/\D/g, "")
          .replace(new RegExp("^" + ddiAtual), "")

  // valor MOSTRADO no input: BR = máscara; internacional = só os dígitos nacionais
  const telExibido =
    paisTel === "BR"
      ? formData["shipping_address.phone"] || ""
      : (formData["shipping_address.phone"] || "")
          .replace(/\D/g, "")
          .replace(new RegExp("^" + ddiAtual), "")

  const onChangeTelefone = (raw: string) => {
    if (paisTel === "BR") {
      setCampo("shipping_address.phone", maskTelefoneBr(raw))
    } else {
      const d = raw.replace(/\D/g, "").slice(0, 15)
      setCampo("shipping_address.phone", d ? "+" + ddiAtual + d : "")
    }
  }

  const onChangePaisTel = (code: string) => {
    const nacional = digitosNacionais()
    const novo = PAISES_TELEFONE.find((p) => p.code === code)
    setPaisTel(code)
    if (code === "BR") {
      setCampo("shipping_address.phone", maskTelefoneBr(nacional))
    } else {
      setCampo(
        "shipping_address.phone",
        nacional ? "+" + (novo?.ddi || "") + nacional : ""
      )
    }
  }

  // FIX deadlock (revisão 06/07): o telefone também muda PROGRAMATICAMENTE
  // (AddressSelect/carrinho preenchem via setFormAddress, sem evento `input`,
  // então o onInput que limpa o setCustomValidity nunca dispara). Sem limpar
  // aqui, um submit com telefone vazio + escolher um endereço salvo deixava o
  // customError grudado e o form travava com a mensagem velha. Limpa a cada
  // mudança de valor — a validação nativa (required/pattern) reavalia no
  // próximo submit e o onInvalid repõe a mensagem certa se ainda for inválido.
  const foneRef = useRef<HTMLInputElement>(null)
  const foneValor = formData["shipping_address.phone"]
  useEffect(() => {
    foneRef.current?.setCustomValidity("")
  }, [foneValor])

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5">
          <div className="flex flex-col gap-1">
            <p className="text-lg small:text-xl font-semibold leading-snug text-ui-fg-base">
              Olá,{" "}
              <span className="text-copamar-primary">
                {customer.first_name}
              </span>
              ! Que bom te ver de volta 💙
            </p>
            <p className="text-sm text-ui-fg-subtle">
              Escolha um endereço salvo abaixo ou preencha um novo.
            </p>
          </div>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", "")
              ) as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </Container>
      )}
      <div className="flex flex-col gap-y-4">
        {/* 1. Pessoais: Nome, Sobrenome */}
        <div className="grid grid-cols-1 small:grid-cols-2 gap-4">
          <Input
            label="Nome"
            name="shipping_address.first_name"
            autoComplete="given-name"
            value={formData["shipping_address.first_name"]}
            onChange={handleChange}
            required
            data-testid="shipping-first-name-input"
          />
          <Input
            label="Sobrenome"
            name="shipping_address.last_name"
            autoComplete="family-name"
            value={formData["shipping_address.last_name"]}
            onChange={handleChange}
            required
            data-testid="shipping-last-name-input"
          />
        </div>

        {/* 2. CPF/CNPJ (identificação fiscal) — mesma posição da ordem QDB */}
        {fiscalSlot}

        {/* 3. TELEFONE de ENTREGA com SELETOR DE PAÍS (jul/26). Brasil padrão e
            100% igual (máscara BR + 10-11 díg + pop-up dos 10). Comprador de fora
            escolhe o país → guarda "+<ddi><dígitos>" e recebe os avisos no número
            dele (WhatsApp é mundial). O campo submetido é o hidden abaixo; o
            servidor auto-detecta BR/intl pelo "+". E-mail ao lado. */}
        <div className="grid grid-cols-1 small:grid-cols-2 gap-4">
          <div className="flex items-end gap-2">
            <select
              value={paisTel}
              onChange={(e) => onChangePaisTel(e.target.value)}
              aria-label="País do telefone"
              className="h-11 shrink-0 rounded-md border border-ui-border-base bg-ui-bg-field px-2 text-ui-fg-base outline-none focus:border-copamar-primary"
              data-testid="shipping-phone-country"
            >
              {PAISES_TELEFONE.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.flag} {p.code === "BR" ? "Brasil" : "+" + p.ddi}
                </option>
              ))}
            </select>
            <Input
              ref={foneRef}
              label={paisTel === "BR" ? "Celular (com DDD)" : "Número (WhatsApp)"}
              // nome só de exibição — o servidor lê o hidden shipping_address.phone
              name="phone_display"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              pattern={
                paisTel === "BR"
                  ? "\\([0-9]{2}\\) [0-9]{4,5}-[0-9]{4}"
                  : undefined
              }
              required
              value={telExibido}
              onChange={(e) => onChangeTelefone(e.target.value)}
              onBlur={(e) => onChangeTelefone(e.currentTarget.value)}
              onInvalid={(e) =>
                e.currentTarget.setCustomValidity(
                  e.currentTarget.validity.valueMissing
                    ? TELEFONE_OBRIGATORIO_MSG
                    : TELEFONE_MSG
                )
              }
              onInput={(e) => e.currentTarget.setCustomValidity("")}
              className="flex-1"
              data-testid="shipping-phone-input"
            />
            {/* valor REAL submetido (BR: máscara nacional; intl: +<ddi><díg>) */}
            <input
              type="hidden"
              name="shipping_address.phone"
              value={formData["shipping_address.phone"] || ""}
            />
          </div>
          <Input
            label="E-mail"
            name="email"
            type="email"
            title="Digite um e-mail válido."
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            required
            data-testid="shipping-email-input"
          />
        </div>

        {/* 4. Título do endereço → Tipo de local → CEP → revelação progressiva */}
        <EnderecoCampos
          nomes={{
            titulo: "shipping_address.endereco_titulo",
            tipoLocal: "shipping_address.tipo_local",
            cep: "shipping_address.postal_code",
            rua: "shipping_address.address_1",
            numero: "shipping_address.numero",
            bairro: "shipping_address.bairro",
            complemento: "shipping_address.address_2",
            cidade: "shipping_address.city",
            uf: "shipping_address.province",
          }}
          valores={{
            titulo: formData["shipping_address.endereco_titulo"],
            tipoLocal: formData["shipping_address.tipo_local"],
            cep: formData["shipping_address.postal_code"],
            rua: formData["shipping_address.address_1"],
            numero: formData["shipping_address.numero"],
            bairro: formData["shipping_address.bairro"],
            complemento: formData["shipping_address.address_2"],
            cidade: formData["shipping_address.city"],
            uf: formData["shipping_address.province"],
          }}
          tids={{
            titulo: "shipping-endereco-titulo-input",
            tipoLocal: "shipping-tipo-local",
            cep: "shipping-postal-code-input",
            rua: "shipping-address-input",
            numero: "shipping-numero-input",
            bairro: "shipping-bairro-input",
            complemento: "shipping-complemento-input",
            cidade: "shipping-city-input",
            uf: "shipping-province-input",
            corrigirCep: "shipping-corrigir-cep",
          }}
          onCampo={setCampo}
          cep={cepCtl}
          // tipo de local é OBRIGATÓRIO no endereço de ENTREGA (jul/26) —
          // cobrança e conta seguem opcionais
          tipoLocalObrigatorio
        >
          <Input
            label="Empresa"
            name="shipping_address.company"
            value={formData["shipping_address.company"]}
            onChange={handleChange}
            autoComplete="organization"
            data-testid="shipping-company-input"
          />
          <CountrySelect
            name="shipping_address.country_code"
            autoComplete="country"
            region={cart?.region}
            value={formData["shipping_address.country_code"]}
            onChange={handleChange}
            required
            data-testid="shipping-country-select"
          />
        </EnderecoCampos>
      </div>
      <div className="my-8">
        <Checkbox
          label="Endereço de cobrança igual ao de entrega"
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          data-testid="billing-address-checkbox"
        />
      </div>
      {!customer && (
        <div className="mb-6">
          <Checkbox
            label="Quero criar uma conta para acompanhar meus pedidos"
            name="create_account"
            checked={createAccount}
            onChange={() => setCreateAccount(!createAccount)}
            data-testid="create-account-checkbox"
          />
          {createAccount && (
            <div className="mt-4 grid grid-cols-1 small:grid-cols-2 gap-4">
              <Input
                label="Senha"
                name="account_password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                data-testid="account-password-input"
              />
              <span className="text-xs text-ui-fg-subtle self-center">
                Mínimo 8 caracteres. Usaremos o e-mail e o nome informados acima.
              </span>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default ShippingAddress
