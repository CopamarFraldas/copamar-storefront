// #87 Fase C — leitura ÚNICA do nível de absorção do metadata do produto.
// Produto de saúde: retorna null quando NÃO há nível validado → o selo não
// renderiza nada (NUNCA mostrar um número chutado). Card, PDP e Bússola
// consomem a mesma lógica.

const ROTULOS: Record<number, string> = {
  1: "Leve",
  2: "Moderado",
  3: "Forte",
  4: "Intenso",
  5: "Máxima",
}

export type Absorcao = {
  nivel: number // 1..5
  rotulo: string
  noturno: boolean
  formato: string | null
}

export function lerAbsorcao(
  product?: { metadata?: Record<string, unknown> | null } | null
): Absorcao | null {
  const m = (product?.metadata || {}) as Record<string, unknown>
  const raw = m.absorcao_gotas
  const nivel =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && raw.trim() !== ""
      ? parseInt(raw, 10)
      : NaN
  if (!Number.isInteger(nivel) || nivel < 1 || nivel > 5) return null
  return {
    nivel,
    rotulo: ROTULOS[nivel] || "",
    noturno: m.uso_noturno === true || m.uso_noturno === "true",
    formato: typeof m.formato === "string" ? m.formato : null,
  }
}
