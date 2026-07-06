"use client"

import { clx } from "@medusajs/ui"
import Input from "@modules/common/components/input"
import { CepEnderecoControl } from "@lib/hooks/use-cep-endereco"
import React, { useEffect, useState } from "react"

/**
 * Campos de endereço no padrão "Quem Disse Berenice" (jul/26) — COMPARTILHADO
 * entre o checkout (entrega + cobrança) e a conta (novo/editar endereço):
 *
 *   Título do endereço (opcional) → Tipo de local (SEMPRE visível, antes do
 *   CEP) → CEP → [revelação: rua/bairro/cidade/UF preenchidos pelo ViaCEP e
 *   TRAVADOS + foco no Número + complemento condicional pelo tipo de local].
 *
 * Os NAMES dos inputs vêm de fora (checkout usa "shipping_address.x", conta usa
 * "x") — o contrato do FormData/submit NÃO muda. Campos travados usam readOnly
 * (nunca disabled: input disabled sai do FormData do submit nativo). Endereço
 * já existente (salvo/migrado) entra em modo "completo" via useCepEndereco e
 * aparece inteiro/editável como sempre.
 */

export const TIPOS_LOCAL = [
  "Apartamento",
  "Comercial",
  "Condomínio",
  "Casa",
  "Outro",
  "Rural",
] as const

/** Tipos onde o complemento é OBRIGATÓRIO (sem bloco/apto/sala/sítio a entrega não chega). */
export const TIPOS_COMPLEMENTO_OBRIGATORIO: ReadonlySet<string> = new Set([
  "Apartamento",
  "Comercial",
  "Condomínio",
  "Rural",
])

// dica do complemento por tipo de local — vira hint e mensagem de validação
const DICA_COMPLEMENTO: Record<string, string> = {
  Apartamento: "bloco e número do apto (ex: bloco B, apto 21)",
  Comercial: "sala/loja/andar (ex: sala 3)",
  Condomínio: "rua interna, casa ou lote (ex: casa 12)",
  Rural: "nome do sítio/chácara ou km de referência (ex: Sítio Boa Vista, km 4)",
}

type Chave =
  | "titulo"
  | "tipoLocal"
  | "cep"
  | "rua"
  | "numero"
  | "bairro"
  | "complemento"
  | "cidade"
  | "uf"

/** Mensagem de tipo de local obrigatório (checkout, jul/26 — caso Danielle). */
export const MSG_TIPO_LOCAL_OBRIGATORIO = "Escolha o tipo de local de entrega."

type Props = {
  /** name de cada input no FormData (contrato do submit — não inventar) */
  nomes: Record<Chave, string>
  valores: Record<Chave, string>
  /** data-testids preservados de cada formulário (E2E Playwright) */
  tids: Partial<Record<Chave | "corrigirCep", string>>
  /** o dono do estado aplica (nomeInput → valor) no seu formData */
  onCampo: (nomeInput: string, valor: string) => void
  cep: CepEnderecoControl
  /**
   * Tipo de local OBRIGATÓRIO (jul/26): só o ENDEREÇO DE ENTREGA do checkout
   * liga isto — a logística precisa saber o tipo de local. Bloqueia o submit
   * sem escolha (backstop nativo + erro visível). Conta/cobrança seguem
   * opcionais (prop ausente = comportamento de sempre, input hidden).
   */
  tipoLocalObrigatorio?: boolean
  /** campos extras dentro do grid revelado (Empresa, País…) */
  children?: React.ReactNode
}

const HINT_CEP: Record<CepEnderecoControl["status"], string> = {
  aguardando: "Digite o CEP que preenchemos o endereço pra você.",
  buscando: "Buscando endereço…",
  ok: "Endereço encontrado! Confira abaixo e informe o número.",
  sem_dados:
    "CEP encontrado, mas sem rua cadastrada (CEP genérico/rural) — complete o endereço.",
  nao_encontrado:
    "Não achamos esse CEP — confira os números ou preencha o endereço manualmente.",
}

const EnderecoCampos = ({
  nomes,
  valores,
  tids,
  onCampo,
  cep,
  tipoLocalObrigatorio,
  children,
}: Props) => {
  const tipo = valores.tipoLocal
  // erro visível "escolha o tipo de local" — acende quando o submit esbarra no
  // required do backstop nativo; apaga assim que o cliente escolhe um tipo
  const [tipoLocalErro, setTipoLocalErro] = useState(false)
  const complObrigatorio = TIPOS_COMPLEMENTO_OBRIGATORIO.has(tipo)
  const dicaCompl = DICA_COMPLEMENTO[tipo]
  const temTravas =
    cep.travas.rua || cep.travas.bairro || cep.travas.cidade || cep.travas.uf

  // Foco pós-lookup (spec QDB item 3): pula pro Número — o único editável —
  // quando a rua veio travada; se o CEP veio sem rua, foca a própria Rua.
  useEffect(() => {
    if (cep.focoTick > 0) {
      ;(cep.travas.rua ? cep.numeroRef : cep.ruaRef).current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep.focoTick])

  return (
    <>
      {/* Título do endereço — curto e opcional; na CONTA vira o address_name do
          endereço salvo, no CHECKOUT viaja no metadata do address (aditivo). */}
      <Input
        label="Título do endereço — ex: Casa da mãe (opcional)"
        name={nomes.titulo}
        maxLength={40}
        autoComplete="off"
        value={valores.titulo}
        onChange={(e) => onCampo(nomes.titulo, e.target.value)}
        data-testid={tids.titulo}
      />

      {/* Tipo de local de entrega — SEMPRE visível, ANTES do CEP (o cliente
          escolhe o tipo antes de digitar o CEP). Botões type="button" não
          entram no FormData → o input com o NAME (hidden ou sr-only, o mesmo
          contrato) carrega o valor no submit. */}
      <div>
        <span className="text-small-regular text-ui-fg-base block mb-2">
          Tipo de local de entrega
          {tipoLocalObrigatorio && <span className="text-rose-500">*</span>}
        </span>
        {tipoLocalObrigatorio ? (
          // OBRIGATÓRIO (checkout/entrega): input required "invisível mas
          // focável" — hidden é isento de validação nativa; sr-only entra na
          // validação, bloqueia o submit e ancora o balão junto dos botões.
          // MESMO name/valor de sempre (contrato do FormData intacto).
          <input
            type="text"
            name={nomes.tipoLocal}
            value={valores.tipoLocal}
            onChange={() => {}}
            required
            aria-hidden="true"
            tabIndex={-1}
            autoComplete="off"
            className="sr-only"
            onInvalid={(e) => {
              e.currentTarget.setCustomValidity(MSG_TIPO_LOCAL_OBRIGATORIO)
              setTipoLocalErro(true)
            }}
            onInput={(e) => e.currentTarget.setCustomValidity("")}
          />
        ) : (
          <input type="hidden" name={nomes.tipoLocal} value={valores.tipoLocal} />
        )}
        <div className="flex flex-wrap gap-2" data-testid={tids.tipoLocal}>
          {TIPOS_LOCAL.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                // clicar de novo desmarca (complemento volta a "se tiver"; no
                // checkout o submit exige escolher de novo)
                const novo = valores.tipoLocal === t ? "" : t
                onCampo(nomes.tipoLocal, novo)
                if (novo) setTipoLocalErro(false)
              }}
              aria-pressed={valores.tipoLocal === t}
              className={clx(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                valores.tipoLocal === t
                  ? "border-ui-border-interactive bg-ui-bg-interactive text-ui-fg-on-color"
                  : tipoLocalErro && !valores.tipoLocal
                  ? "border-rose-400 bg-ui-bg-subtle text-ui-fg-subtle hover:text-ui-fg-base hover:border-ui-border-strong"
                  : "border-ui-border-base bg-ui-bg-subtle text-ui-fg-subtle hover:text-ui-fg-base hover:border-ui-border-strong"
              )}
              data-testid={tids.tipoLocal ? `${tids.tipoLocal}-${t}` : undefined}
            >
              {t}
            </button>
          ))}
        </div>
        {tipoLocalErro && !valores.tipoLocal && (
          <span
            className="text-xs text-rose-500 mt-1 block"
            role="alert"
            data-testid={
              tids.tipoLocal ? `${tids.tipoLocal}-erro` : undefined
            }
          >
            {MSG_TIPO_LOCAL_OBRIGATORIO}
          </span>
        )}
      </div>

      {/* CEP — o gatilho da revelação progressiva */}
      <div>
        <Input
          label="CEP"
          name={nomes.cep}
          inputMode="numeric"
          autoComplete="postal-code"
          pattern="[0-9]{5}[\s\-]?[0-9]{3}"
          maxLength={9}
          required
          value={valores.cep}
          onChange={(e) => {
            onCampo(nomes.cep, e.target.value)
            cep.onCepChange(e.target.value)
          }}
          onInvalid={(e) =>
            e.currentTarget.setCustomValidity(
              "CEP incompleto — digite os 8 números (ex.: 09230-410)."
            )
          }
          onInput={(e) => e.currentTarget.setCustomValidity("")}
          ref={cep.cepRef}
          data-testid={tids.cep}
        />
        <span className="text-xs text-ui-fg-subtle mt-1 block" aria-live="polite">
          {HINT_CEP[cep.status]}
        </span>
      </div>

      {/* Revelação: só depois de um CEP completo (ou direto, em modo completo).
          animate-fade-in-top = transição suave já existente no tailwind.config. */}
      {cep.revelado && (
        <div className="animate-fade-in-top flex flex-col gap-y-4">
          {temTravas && (
            <div className="flex items-baseline justify-between gap-x-4">
              <span className="text-xs text-ui-fg-subtle">
                Preenchemos o endereço pelo CEP — só falta o número.
              </span>
              {/* volta e destrava tudo (CEP errado / quer ajustar algum campo) */}
              <button
                type="button"
                onClick={cep.destravar}
                className="text-xs text-ui-fg-interactive hover:text-ui-fg-interactive-hover underline whitespace-nowrap"
                data-testid={tids.corrigirCep}
              >
                Corrigir CEP
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 small:grid-cols-2 gap-4">
            <Input
              label={cep.travas.rua ? "Endereço" : "Endereço (só a rua, sem número)"}
              name={nomes.rua}
              autoComplete="address-line1"
              required
              travado={cep.travas.rua}
              value={valores.rua}
              onChange={(e) => onCampo(nomes.rua, e.target.value)}
              ref={cep.ruaRef}
              data-testid={tids.rua}
            />
            <Input
              label="Número (da rua) — ex: 388"
              name={nomes.numero}
              inputMode="numeric"
              required
              value={valores.numero}
              onChange={(e) => onCampo(nomes.numero, e.target.value)}
              ref={cep.numeroRef}
              data-testid={tids.numero}
            />
            <Input
              label="Bairro"
              name={nomes.bairro}
              required
              travado={cep.travas.bairro}
              value={valores.bairro}
              onChange={(e) => onCampo(nomes.bairro, e.target.value)}
              data-testid={tids.bairro}
            />
            {/* Complemento CONDICIONAL: obrigatório (asterisco ao vivo) quando o
                tipo de local é Apartamento/Comercial/Condomínio/Rural. */}
            <div>
              <Input
                label={
                  complObrigatorio
                    ? "Complemento — bloco/apto/sala/sítio"
                    : "Complemento (se tiver)"
                }
                name={nomes.complemento}
                autoComplete="address-line2"
                required={complObrigatorio}
                value={valores.complemento}
                onChange={(e) => onCampo(nomes.complemento, e.target.value)}
                onInvalid={(e) =>
                  e.currentTarget.setCustomValidity(
                    `Informe o complemento — ${dicaCompl || "bloco/apto/sala/sítio"}.`
                  )
                }
                onInput={(e) => e.currentTarget.setCustomValidity("")}
                data-testid={tids.complemento}
              />
              <span className="text-xs text-ui-fg-subtle mt-1 block">
                {complObrigatorio
                  ? `Obrigatório para ${tipo.toLowerCase()}: ${dicaCompl}`
                  : "Opcional — apto, bloco, referência… se tiver."}
              </span>
            </div>
            <Input
              label="Cidade"
              name={nomes.cidade}
              autoComplete="address-level2"
              required
              travado={cep.travas.cidade}
              value={valores.cidade}
              onChange={(e) => onCampo(nomes.cidade, e.target.value)}
              data-testid={tids.cidade}
            />
            <Input
              label="Estado (UF)"
              name={nomes.uf}
              autoComplete="address-level1"
              travado={cep.travas.uf}
              value={valores.uf}
              onChange={(e) => onCampo(nomes.uf, e.target.value)}
              data-testid={tids.uf}
            />
            {children}
          </div>
        </div>
      )}
    </>
  )
}

export default EnderecoCampos
