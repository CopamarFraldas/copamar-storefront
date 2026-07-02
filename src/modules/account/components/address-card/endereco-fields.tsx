"use client"

import { useState } from "react"
import Input from "@modules/common/components/input"
import { fetchCep, isValidCep } from "@lib/util/viacep"

/**
 * Bloco de campos de endereço BR com autocompletar por CEP (ViaCEP), usado nos
 * forms de endereço da CONTA (adicionar/editar). Mesmo padrão do checkout:
 * Número/Bairro/Complemento próprios + CEP preenche rua/bairro/cidade/UF. Os
 * inputs são controlados mas têm `name` → a server action lê tudo pelo FormData.
 * Em `defaults` (edição) o número/bairro vêm do metadata estruturado do endereço.
 */
export type EnderecoDefaults = {
  postal_code?: string
  address_1?: string
  numero?: string
  bairro?: string
  address_2?: string
  city?: string
  province?: string
}

const EnderecoFields = ({ defaults }: { defaults?: EnderecoDefaults }) => {
  const d = defaults || {}
  const [f, setF] = useState({
    postal_code: d.postal_code || "",
    address_1: d.address_1 || "",
    numero: d.numero || "",
    bairro: d.bairro || "",
    address_2: d.address_2 || "",
    city: d.city || "",
    province: d.province || "",
  })
  const [cepLoading, setCepLoading] = useState(false)
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }))

  const onCep = async (raw: string) => {
    set("postal_code", raw)
    if (!isValidCep(raw)) return
    setCepLoading(true)
    const r = await fetchCep(raw)
    setCepLoading(false)
    if (!r) return
    setF((p) => ({
      ...p,
      address_1: r.logradouro || p.address_1,
      bairro: r.bairro || p.bairro,
      city: r.localidade || p.city,
      province: r.uf || p.province,
    }))
  }

  return (
    <>
      <div className="grid grid-cols-[144px_1fr] gap-x-2">
        <Input
          label="CEP"
          name="postal_code"
          required
          autoComplete="postal-code"
          value={f.postal_code}
          onChange={(e) => onCep(e.target.value)}
          data-testid="postal-code-input"
        />
        <Input
          label="Cidade"
          name="city"
          required
          autoComplete="locality"
          value={f.city}
          onChange={(e) => set("city", e.target.value)}
          data-testid="city-input"
        />
      </div>
      <span className="text-xs text-ui-fg-subtle -mt-1 mb-1 block">
        {cepLoading ? "Buscando endereço…" : "Digite o CEP que preenchemos o endereço."}
      </span>
      <Input
        label="Endereço (só a rua, sem número)"
        name="address_1"
        required
        autoComplete="address-line1"
        value={f.address_1}
        onChange={(e) => set("address_1", e.target.value)}
        data-testid="address-1-input"
      />
      <div className="grid grid-cols-2 gap-x-2">
        <Input
          label="Número (da rua)"
          name="numero"
          required
          placeholder="ex: 388"
          value={f.numero}
          onChange={(e) => set("numero", e.target.value)}
          data-testid="numero-input"
        />
        <Input
          label="Bairro"
          name="bairro"
          required
          value={f.bairro}
          onChange={(e) => set("bairro", e.target.value)}
          data-testid="bairro-input"
        />
      </div>
      <Input
        label="Complemento — apto/bloco (ex: apto 21)"
        name="address_2"
        placeholder="ex: apto 21, bloco B"
        autoComplete="address-line2"
        value={f.address_2}
        onChange={(e) => set("address_2", e.target.value)}
        data-testid="address-2-input"
      />
      <Input
        label="Estado"
        name="province"
        autoComplete="address-level1"
        value={f.province}
        onChange={(e) => set("province", e.target.value)}
        data-testid="state-input"
      />
    </>
  )
}

export default EnderecoFields
