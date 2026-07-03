"use client"

import { useState } from "react"
import EnderecoCampos from "@modules/common/components/endereco-campos"
import { useCepEndereco } from "@lib/hooks/use-cep-endereco"

/**
 * Bloco de campos de endereço BR da CONTA (adicionar/editar), agora no padrão
 * "Quem Disse Berenice" (jul/26) compartilhado com o checkout: Título do
 * endereço (vira o address_name do endereço salvo) → Tipo de local → CEP →
 * revelação com campos do ViaCEP travados + foco no Número + complemento
 * condicional. EDIÇÃO (defaults preenchidos) NÃO passa pelo fluxo progressivo:
 * aparece completo e editável como sempre. Os inputs são controlados mas têm
 * `name` → a server action lê tudo pelo FormData (por isso travado = readOnly,
 * nunca disabled). Em `defaults` o número/bairro vêm do metadata estruturado.
 */
export type EnderecoDefaults = {
  postal_code?: string
  address_1?: string
  numero?: string
  bairro?: string
  address_2?: string
  city?: string
  province?: string
  /** título do endereço (address_name / metadata.titulo) */
  endereco_titulo?: string
  /** tipo de local de entrega (metadata.tipo_local) */
  tipo_local?: string
}

const EnderecoFields = ({
  defaults,
  children,
}: {
  defaults?: EnderecoDefaults
  /** campos extras dentro do grid revelado (ex.: País) */
  children?: React.ReactNode
}) => {
  const d = defaults || {}
  const [f, setF] = useState({
    postal_code: d.postal_code || "",
    address_1: d.address_1 || "",
    numero: d.numero || "",
    bairro: d.bairro || "",
    address_2: d.address_2 || "",
    city: d.city || "",
    province: d.province || "",
    endereco_titulo: d.endereco_titulo || "",
    tipo_local: d.tipo_local || "",
  })
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }))

  // edição de endereço existente → modo completo (tudo visível/editável);
  // endereço novo → fluxo progressivo pelo CEP
  const cepCtl = useCepEndereco({
    completoInicial: !!(d.postal_code || d.address_1),
    aplicar: (r) =>
      setF((p) => ({
        ...p,
        address_1: r.logradouro || p.address_1,
        bairro: r.bairro || p.bairro,
        city: r.localidade || p.city,
        province: r.uf || p.province,
      })),
  })

  return (
    <EnderecoCampos
      nomes={{
        titulo: "endereco_titulo",
        tipoLocal: "tipo_local",
        cep: "postal_code",
        rua: "address_1",
        numero: "numero",
        bairro: "bairro",
        complemento: "address_2",
        cidade: "city",
        uf: "province",
      }}
      valores={{
        titulo: f.endereco_titulo,
        tipoLocal: f.tipo_local,
        cep: f.postal_code,
        rua: f.address_1,
        numero: f.numero,
        bairro: f.bairro,
        complemento: f.address_2,
        cidade: f.city,
        uf: f.province,
      }}
      tids={{
        titulo: "endereco-titulo-input",
        tipoLocal: "tipo-local",
        cep: "postal-code-input",
        rua: "address-1-input",
        numero: "numero-input",
        bairro: "bairro-input",
        complemento: "address-2-input",
        cidade: "city-input",
        uf: "state-input",
        corrigirCep: "corrigir-cep",
      }}
      onCampo={set}
      cep={cepCtl}
    >
      {children}
    </EnderecoCampos>
  )
}

export default EnderecoFields
