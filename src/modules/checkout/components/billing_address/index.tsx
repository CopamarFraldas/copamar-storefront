import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Input from "@modules/common/components/input"
import EnderecoCampos from "@modules/common/components/endereco-campos"
import { mapKeys } from "lodash"
import React, { useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"
import { useCepEndereco } from "@lib/hooks/use-cep-endereco"
import { maskTelefoneBr, TELEFONE_MSG } from "@lib/util/telefone"
import { derivaEndereco } from "@lib/util/endereco"

/**
 * Endereço de COBRANÇA — mesmo padrão QDB do endereço de entrega (jul/26):
 * pessoais + telefone mascarado primeiro, endereço revelado pelo CEP com
 * campos do ViaCEP travados. Endereço já existente no carrinho ou selecionado
 * no AddressSelect entra completo/editável (sem fluxo progressivo). Names dos
 * inputs inalterados (billing_address.* — setAddresses/bling-push intactos).
 */
const BillingAddress = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer?: HttpTypes.StoreCustomer | null
}) => {
  const ba: any = cart?.billing_address || {}
  const baE = derivaEndereco(ba) // novo (metadata) OU migrado (address_1 mushed + bairro no address_2)
  const baMd = (ba.metadata || {}) as Record<string, any>
  const [formData, setFormData] = useState<any>({
    "billing_address.first_name": ba.first_name || "",
    "billing_address.last_name": ba.last_name || "",
    "billing_address.address_1": baE.logradouro,
    "billing_address.numero": baE.numero,
    "billing_address.bairro": baE.bairro,
    "billing_address.address_2": baE.complemento,
    "billing_address.company": ba.company || "",
    "billing_address.postal_code": ba.postal_code || "",
    "billing_address.city": ba.city || "",
    "billing_address.country_code": ba.country_code || "",
    "billing_address.province": ba.province || "",
    "billing_address.phone": maskTelefoneBr(ba.phone || ""),
    "billing_address.endereco_titulo": String(baMd.titulo || ""),
    "billing_address.tipo_local": String(baMd.tipo_local || ""),
  })

  // fluxo progressivo só pra cobrança NOVA; endereço já gravado entra completo
  const cepCtl = useCepEndereco({
    completoInicial: !!(ba.postal_code || ba.address_1),
    aplicar: (r) =>
      setFormData((prev: any) => ({
        ...prev,
        "billing_address.address_1":
          r.logradouro || prev["billing_address.address_1"],
        "billing_address.bairro": r.bairro || prev["billing_address.bairro"],
        "billing_address.city": r.localidade || prev["billing_address.city"],
        "billing_address.province": r.uf || prev["billing_address.province"],
        "billing_address.country_code":
          prev["billing_address.country_code"] || "br",
      })),
  })

  // Endereços salvos do cliente na região atual → seletor "usar endereço salvo"
  // (Marco 18/06: não re-digitar a cobrança quando difere da entrega).
  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )
  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (address?: HttpTypes.StoreCartAddress) => {
    if (!address) return
    setFormData((prev: any) => ({
      ...prev,
      "billing_address.first_name": address.first_name || "",
      "billing_address.last_name": address.last_name || "",
      "billing_address.address_1": derivaEndereco(address).logradouro,
      "billing_address.numero": derivaEndereco(address).numero,
      "billing_address.bairro": derivaEndereco(address).bairro,
      "billing_address.address_2": derivaEndereco(address).complemento,
      "billing_address.company": address.company || "",
      "billing_address.postal_code": address.postal_code || "",
      "billing_address.city": address.city || "",
      "billing_address.country_code": address.country_code || "",
      "billing_address.province": address.province || "",
      "billing_address.phone": maskTelefoneBr(address.phone || ""),
      "billing_address.endereco_titulo": String(
        (address as any)?.address_name || (address?.metadata as any)?.titulo || ""
      ),
      "billing_address.tipo_local": String(
        (address?.metadata as any)?.tipo_local || ""
      ),
    }))
    // endereço salvo → completo/editável, sem fluxo progressivo
    if (address.postal_code || address.address_1) {
      cepCtl.marcarCompleto()
    }
  }

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

  const setCampo = (nomeInput: string, valor: string) =>
    setFormData((prev: any) => ({ ...prev, [nomeInput]: valor }))

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5">
          <p className="text-small-regular">
            Quer usar um dos seus endereços salvos para a cobrança?
          </p>
          <AddressSelect
            addresses={customer!.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("billing_address.", "")
              ) as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </Container>
      )}
      <div className="flex flex-col gap-y-4">
        <div className="grid grid-cols-1 small:grid-cols-2 gap-4">
          <Input
            label="Nome"
            name="billing_address.first_name"
            autoComplete="given-name"
            value={formData["billing_address.first_name"]}
            onChange={handleChange}
            required
            data-testid="billing-first-name-input"
          />
          <Input
            label="Sobrenome"
            name="billing_address.last_name"
            autoComplete="family-name"
            value={formData["billing_address.last_name"]}
            onChange={handleChange}
            required
            data-testid="billing-last-name-input"
          />
          <Input
            label="Telefone (com DDD)"
            name="billing_address.phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            pattern="\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}"
            value={formData["billing_address.phone"]}
            onChange={(e) =>
              setCampo(e.target.name, maskTelefoneBr(e.target.value))
            }
            onInvalid={(e) => e.currentTarget.setCustomValidity(TELEFONE_MSG)}
            onInput={(e) => e.currentTarget.setCustomValidity("")}
            data-testid="billing-phone-input"
          />
        </div>

        <EnderecoCampos
          nomes={{
            titulo: "billing_address.endereco_titulo",
            tipoLocal: "billing_address.tipo_local",
            cep: "billing_address.postal_code",
            rua: "billing_address.address_1",
            numero: "billing_address.numero",
            bairro: "billing_address.bairro",
            complemento: "billing_address.address_2",
            cidade: "billing_address.city",
            uf: "billing_address.province",
          }}
          valores={{
            titulo: formData["billing_address.endereco_titulo"],
            tipoLocal: formData["billing_address.tipo_local"],
            cep: formData["billing_address.postal_code"],
            rua: formData["billing_address.address_1"],
            numero: formData["billing_address.numero"],
            bairro: formData["billing_address.bairro"],
            complemento: formData["billing_address.address_2"],
            cidade: formData["billing_address.city"],
            uf: formData["billing_address.province"],
          }}
          tids={{
            titulo: "billing-endereco-titulo-input",
            tipoLocal: "billing-tipo-local",
            cep: "billing-postal-input",
            rua: "billing-address-input",
            numero: "billing-numero-input",
            bairro: "billing-bairro-input",
            complemento: "billing-complemento-input",
            cidade: "billing-city-input",
            uf: "billing-province-input",
            corrigirCep: "billing-corrigir-cep",
          }}
          onCampo={setCampo}
          cep={cepCtl}
        >
          <Input
            label="Empresa"
            name="billing_address.company"
            value={formData["billing_address.company"]}
            onChange={handleChange}
            autoComplete="organization"
            data-testid="billing-company-input"
          />
          <CountrySelect
            name="billing_address.country_code"
            autoComplete="country"
            region={cart?.region}
            value={formData["billing_address.country_code"]}
            onChange={handleChange}
            required
            data-testid="billing-country-select"
          />
        </EnderecoCampos>
      </div>
    </>
  )
}

export default BillingAddress
