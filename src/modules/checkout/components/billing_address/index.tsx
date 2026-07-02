import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Input from "@modules/common/components/input"
import { mapKeys } from "lodash"
import React, { useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"
import { fetchCep, isValidCep } from "@lib/util/viacep"
import { derivaEndereco } from "@lib/util/endereco"

const BillingAddress = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer?: HttpTypes.StoreCustomer | null
}) => {
  const ba: any = cart?.billing_address || {}
  const baE = derivaEndereco(ba) // novo (metadata) OU migrado (address_1 mushed + bairro no address_2)
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
    "billing_address.phone": ba.phone || "",
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
      "billing_address.phone": address.phone || "",
    }))
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

  const [cepLoading, setCepLoading] = useState(false)
  const handleCepLookup = async (raw: string) => {
    if (!isValidCep(raw)) return
    setCepLoading(true)
    const r = await fetchCep(raw)
    setCepLoading(false)
    if (!r) return
    setFormData((prev: any) => ({
      ...prev,
      "billing_address.address_1": r.logradouro || prev["billing_address.address_1"],
      "billing_address.bairro": r.bairro || prev["billing_address.bairro"],
      "billing_address.city": r.localidade || prev["billing_address.city"],
      "billing_address.province": r.uf || prev["billing_address.province"],
      "billing_address.country_code": prev["billing_address.country_code"] || "br",
    }))
  }

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
      <div className="mb-4">
        <Input
          label="CEP"
          name="billing_address.postal_code"
          autoComplete="postal-code"
          value={formData["billing_address.postal_code"]}
          onChange={(e) => {
            handleChange(e)
            handleCepLookup(e.target.value)
          }}
          required
          data-testid="billing-postal-input"
        />
        <span className="text-xs text-ui-fg-subtle mt-1 block">
          {cepLoading
            ? "Buscando endereço…"
            : "Digite o CEP que preenchemos o endereço pra você."}
        </span>
      </div>
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
          label="Endereço (só a rua, sem número)"
          name="billing_address.address_1"
          autoComplete="address-line1"
          value={formData["billing_address.address_1"]}
          onChange={handleChange}
          required
          data-testid="billing-address-input"
        />
        <Input
          label="Número (da rua, ex: 388)"
          name="billing_address.numero"
          placeholder="ex: 388"
          value={formData["billing_address.numero"]}
          onChange={handleChange}
          required
          data-testid="billing-numero-input"
        />
        <Input
          label="Bairro"
          name="billing_address.bairro"
          value={formData["billing_address.bairro"]}
          onChange={handleChange}
          required
          data-testid="billing-bairro-input"
        />
        <Input
          label="Complemento — apto/bloco (ex: apto 21)"
          name="billing_address.address_2"
          placeholder="ex: apto 21, bloco B"
          autoComplete="address-line2"
          value={formData["billing_address.address_2"]}
          onChange={handleChange}
          data-testid="billing-complemento-input"
        />
        <Input
          label="Empresa"
          name="billing_address.company"
          value={formData["billing_address.company"]}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="billing-company-input"
        />
        <Input
          label="Cidade"
          name="billing_address.city"
          autoComplete="address-level2"
          value={formData["billing_address.city"]}
          onChange={handleChange}
          required
          data-testid="billing-city-input"
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
        <Input
          label="Estado"
          name="billing_address.province"
          autoComplete="address-level1"
          value={formData["billing_address.province"]}
          onChange={handleChange}
          data-testid="billing-province-input"
        />
        <Input
          label="Telefone"
          name="billing_address.phone"
          autoComplete="tel"
          value={formData["billing_address.phone"]}
          onChange={handleChange}
          data-testid="billing-phone-input"
        />
      </div>
    </>
  )
}

export default BillingAddress
