"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { Heading, clx } from "@medusajs/ui"
import Input from "@modules/common/components/input"
import { maskCpfCnpj, isValidCpf, isValidCnpj } from "@lib/util/cpf"

/**
 * Identificação fiscal (FATURAMENTO) — documento que vai na NOTA FISCAL e no
 * contato do Bling. É independente de QUEM PAGA (titular do cartão, capturado
 * no passo de pagamento). Copamar é atacadista/distribuidora: vende pra Pessoa
 * Física (CPF) e Empresa (CNPJ + razão social + inscrição estadual / isento).
 *
 * Renderiza dentro do MESMO <form> do passo de endereço — os campos viajam no
 * FormData e setAddresses persiste em cart.metadata (fiscal_tipo,
 * fiscal_documento, razao_social, inscricao_estadual, isento_ie).
 */
const IdentificacaoFiscal = ({
  cart,
}: {
  cart: HttpTypes.StoreCart | null
}) => {
  const meta = (cart?.metadata || {}) as Record<string, any>
  const [tipo, setTipo] = useState<"F" | "J">(
    meta.fiscal_tipo === "J" ? "J" : "F"
  )
  const [doc, setDoc] = useState(maskCpfCnpj(meta.fiscal_documento || ""))
  const [razao, setRazao] = useState((meta.razao_social as string) || "")
  const [ie, setIe] = useState((meta.inscricao_estadual as string) || "")
  const [isento, setIsento] = useState(
    meta.isento_ie === "true" || meta.isento_ie === true
  )

  const docDigits = doc.replace(/\D/g, "")
  const docOk = tipo === "F" ? isValidCpf(docDigits) : isValidCnpj(docDigits)
  // Só acusa erro quando o documento JÁ tem o tamanho esperado do tipo atual
  // (11 p/ CPF, 14 p/ CNPJ). Assim não aparece "CNPJ inválido" durante a
  // digitação nem logo após alternar PF↔Empresa (quando o nº ainda é do outro
  // tamanho) — some o erro-fantasma do toggle.
  const expectedLen = tipo === "F" ? 11 : 14
  const showDocError = docDigits.length === expectedLen && !docOk

  return (
    <div className="mt-2" data-testid="identificacao-fiscal">
      <Heading level="h2" className="text-3xl-regular gap-x-4 pb-1 pt-2">
        Dados para a nota fiscal
      </Heading>
      <p className="text-sm text-ui-fg-subtle mb-4">
        Em nome de quem emitimos a nota? Esse é o cadastro fiscal — quem vai{" "}
        <strong>pagar</strong> você escolhe na hora do pagamento.
      </p>

      {/* tipo F/J viaja no submit */}
      <input type="hidden" name="fiscal_tipo" value={tipo} />

      {/* alternância Pessoa Física | Empresa */}
      <div className="inline-flex rounded-lg border border-ui-border-base bg-ui-bg-subtle p-1 mb-4">
        {(
          [
            ["F", "Pessoa Física"],
            ["J", "Empresa"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setTipo(v)}
            className={clx(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              {
                "bg-ui-bg-base text-ui-fg-base shadow-sm": tipo === v,
                "text-ui-fg-subtle hover:text-ui-fg-base": tipo !== v,
              }
            )}
            data-testid={`fiscal-tipo-${v}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={tipo === "F" ? "CPF" : "CNPJ"}
          name="fiscal_documento"
          inputMode="numeric"
          autoComplete="off"
          value={doc}
          onChange={(e) => setDoc(maskCpfCnpj(e.target.value))}
          required
          data-testid="fiscal-documento-input"
        />
        {tipo === "J" && (
          <Input
            label="Razão social"
            name="fiscal_razao_social"
            value={razao}
            onChange={(e) => setRazao(e.target.value)}
            required
            data-testid="fiscal-razao-input"
          />
        )}
        {tipo === "J" && !isento && (
          <Input
            label="Inscrição estadual"
            name="fiscal_ie"
            inputMode="numeric"
            value={ie}
            onChange={(e) => setIe(e.target.value)}
            data-testid="fiscal-ie-input"
          />
        )}
      </div>

      {showDocError && (
        <p className="text-xs text-rose-500 mt-1" data-testid="fiscal-doc-error">
          {tipo === "F"
            ? "CPF inválido — confira os números."
            : "CNPJ inválido — confira os números."}
        </p>
      )}

      {tipo === "J" && (
        <label className="flex items-center gap-2 mt-3 text-sm text-ui-fg-subtle">
          <input
            type="checkbox"
            name="fiscal_isento_ie"
            checked={isento}
            onChange={(e) => setIsento(e.target.checked)}
            data-testid="fiscal-isento-checkbox"
          />
          Isento de inscrição estadual
        </label>
      )}
    </div>
  )
}

export default IdentificacaoFiscal
