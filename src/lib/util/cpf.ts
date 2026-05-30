/**
 * Validação de documento do pagador (CPF ou CNPJ) — usado nos forms de
 * pagamento. Copamar é atacadista/distribuidora → vende pra PF (CPF) e PJ (CNPJ).
 */

/**
 * Valida CPF pelo dígito verificador (não aceita 11 dígitos quaisquer nem
 * sequências repetidas tipo 111.111.111-11).
 */
export function isValidCpf(value: string): boolean {
  const d = (value || "").replace(/\D/g, "")
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const calc = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += parseInt(d[i]) * (len + 1 - i)
    const r = (sum * 10) % 11
    return r === 10 ? 0 : r
  }
  return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10])
}

/** Valida CNPJ pelos 2 dígitos verificadores (rejeita 14 quaisquer/repetidos). */
export function isValidCnpj(value: string): boolean {
  const d = (value || "").replace(/\D/g, "")
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false
  const calc = (len: number) => {
    const w = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < len; i++) sum += parseInt(d[i]) * w[i]
    const r = sum % 11
    return r < 2 ? 0 : 11 - r
  }
  return calc(12) === parseInt(d[12]) && calc(13) === parseInt(d[13])
}

/** Aceita CPF (11) OU CNPJ (14), validando o dígito verificador do tipo certo. */
export function isValidCpfOrCnpj(value: string): boolean {
  const d = (value || "").replace(/\D/g, "")
  if (d.length === 11) return isValidCpf(d)
  if (d.length === 14) return isValidCnpj(d)
  return false
}

/** "cpf" (11) | "cnpj" (14) | null (qualquer outro tamanho). */
export function docType(value: string): "cpf" | "cnpj" | null {
  const d = (value || "").replace(/\D/g, "")
  if (d.length === 11) return "cpf"
  if (d.length === 14) return "cnpj"
  return null
}

/**
 * Máscara dinâmica: até 11 dígitos formata como CPF (000.000.000-00);
 * 12–14 dígitos formata como CNPJ (00.000.000/0000-00).
 */
export function maskCpfCnpj(value: string): string {
  const d = (value || "").replace(/\D/g, "").slice(0, 14)
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
}
