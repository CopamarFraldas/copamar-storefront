/**
 * Valida CPF pelo dígito verificador (não aceita 11 dígitos quaisquer nem
 * sequências repetidas tipo 111.111.111-11). Usado nos forms de pagamento.
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
