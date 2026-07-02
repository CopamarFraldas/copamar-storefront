/**
 * Cadastro da frota (multi-motorista) — agora com PIN EDITÁVEL (Marco 24/06):
 * a fonte da verdade é a tabela Supabase `entregas_motoristas` (id, nome, pin,
 * ativo), trocável no admin (botão "Trocar senha") SEM deploy. O login do app
 * valida pela tabela; se o banco cair, cai no FALLBACK (os PINs originais) pra
 * o motorista nunca ficar trancado de fora numa instabilidade.
 *
 * "Lalamove" não está aqui (não tem login — é destino de despacho só no admin).
 */
export type Motorista = { id: string; nome: string; pin: string }

const SUPA = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY

// Fallback de resiliência (banco fora) = os PINs originais. NÃO é a fonte da
// verdade — a tabela é. Se a tabela responder (mesmo vazio), ela vence.
const FALLBACK: Motorista[] = [
  { id: "dede", nome: "Dedé", pin: "8520" },
  { id: "carro2", nome: "Motorista 2", pin: "3210" },
  { id: "carro3", nome: "Motorista 3", pin: "9876" },
  { id: "carro4", nome: "Motorista 4", pin: "0147" },
]

/** Consulta a tabela. Retorna a lista (pode ser []) OU null se o banco falhou. */
async function buscar(filtro: string): Promise<Motorista[] | null> {
  if (!SUPA || !KEY) return null
  try {
    const r = await fetch(
      `${SUPA}/rest/v1/entregas_motoristas?${filtro}&ativo=eq.true&select=id,nome,pin`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: "no-store" }
    )
    if (!r.ok) return null
    const rows = await r.json()
    return Array.isArray(rows) ? (rows as Motorista[]) : null
  } catch {
    return null // erro de rede → fallback
  }
}

export async function motoristaPorPin(pin: string): Promise<Motorista | null> {
  const p = (pin || "").trim()
  if (!p) return null
  const rows = await buscar(`pin=eq.${encodeURIComponent(p)}`)
  // tabela respondeu (mesmo vazio) = autoritativa → PIN trocado tem efeito na hora
  if (rows !== null) return rows[0] || null
  return FALLBACK.find((m) => m.pin === p) || null // banco fora → fallback
}

export async function motoristaPorId(id: string | null | undefined): Promise<Motorista | null> {
  if (!id) return null
  const rows = await buscar(`id=eq.${encodeURIComponent(id)}`)
  if (rows !== null) return rows[0] || null
  return FALLBACK.find((m) => m.id === id) || null
}
