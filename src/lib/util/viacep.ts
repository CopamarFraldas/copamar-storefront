/**
 * Busca de endereço por CEP (ViaCEP) — usada no checkout pra auto-preencher
 * o endereço quando o cliente digita o CEP. Roda no browser (ViaCEP tem CORS
 * aberto). Nunca bloqueia o checkout: em falha/CEP inexistente, retorna null
 * e o cliente preenche manualmente.
 */
export type ViaCepResult = {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

export function onlyDigits(v: string): string {
  return (v || "").replace(/\D/g, "")
}

export function isValidCep(v: string): boolean {
  return onlyDigits(v).length === 8
}

export async function fetchCep(cepRaw: string): Promise<ViaCepResult | null> {
  const cep = onlyDigits(cepRaw)
  if (cep.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      headers: { Accept: "application/json" },
    })
    if (!res.ok) return null
    const data = await res.json()
    // ViaCEP: CEP inexistente retorna HTTP 200 com { "erro": true } (não 404)
    if (!data || data.erro) return null
    return {
      logradouro: data.logradouro || "",
      bairro: data.bairro || "",
      localidade: data.localidade || "",
      uf: data.uf || "",
    }
  } catch {
    return null
  }
}
