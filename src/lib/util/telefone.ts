/**
 * Telefone BR — máscara e validação (jul/26, redesign de endereço estilo QDB).
 * Caso real: "998590034" (9 dígitos, SEM DDD) passou no checkout e derrubou o
 * pedido no ERP. Daqui em diante: máscara ao digitar ((11) 99999-9999) e
 * validação 10-11 dígitos COM DDD no submit (client via pattern + servidor).
 */

/**
 * Só dígitos, tolerando o "+55" que o autofill do browser costuma incluir:
 * remove o código do país SÓ quando sobram mais de 11 dígitos — assim não
 * comemos o DDD 55 (região de Santa Maria/RS) de um número digitado sem +55.
 */
export function telefoneDigits(v: string): string {
  let d = (v || "").replace(/\D/g, "")
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2)
  return d.slice(0, 11)
}

/** Máscara progressiva: (11) 9999-9999 (fixo, 10 díg) / (11) 99999-9999 (celular, 11 díg). */
export function maskTelefoneBr(v: string): string {
  const d = telefoneDigits(v)
  if (!d) return ""
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Válido = 10 (fixo) ou 11 (celular) dígitos, com DDD real (11-99, sem zero à esquerda). */
export function isValidTelefoneBr(v: string): boolean {
  const d = telefoneDigits(v)
  if (d.length !== 10 && d.length !== 11) return false
  const ddd = parseInt(d.slice(0, 2), 10)
  return ddd >= 11 && ddd <= 99
}

export const TELEFONE_MSG =
  "Telefone incompleto — inclua o DDD (ex.: (11) 99859-0034)."

/**
 * Valida telefone OPCIONAL: vazio passa; preenchido exige DDD. Retorna a
 * mensagem de erro ou null. Usada no client (setCustomValidity) e como
 * backstop nas server actions da CONTA (novo/editar endereço) e do telefone
 * de COBRANÇA do checkout — fluxos onde telefone segue não-obrigatório.
 */
export function validaTelefoneOpcional(v: unknown): string | null {
  const s = typeof v === "string" ? v : ""
  if (!s.trim()) return null
  return isValidTelefoneBr(s) ? null : TELEFONE_MSG
}

export const TELEFONE_OBRIGATORIO_MSG =
  "Informe um telefone com DDD — o entregador precisa falar com você na entrega (ex.: (11) 99859-0034)."

/**
 * Valida telefone OBRIGATÓRIO — SÓ no telefone de ENTREGA do checkout
 * (jul/26, caso Danielle: pedido sem telefone = entrega às cegas, o motorista
 * não consegue ligar). Vazio NÃO passa; preenchido exige 10-11 dígitos com
 * DDD. NÃO usar nos fluxos da conta nem no telefone de cobrança — esses
 * continuam com validaTelefoneOpcional.
 */
export function validaTelefoneObrigatorio(v: unknown): string | null {
  const s = typeof v === "string" ? v : ""
  if (!s.trim()) return TELEFONE_OBRIGATORIO_MSG
  return isValidTelefoneBr(s) ? null : TELEFONE_MSG
}
