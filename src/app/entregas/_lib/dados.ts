import rotaJson from "../_data/rota.json"

// pendente | entregue | ausente (ninguém em casa, culpa do cliente, +3 dias) |
// adiado ("deixar pra outro dia" — imprevisto NOSSO, pede desculpa, sem contar
// tentativa contra o cliente) — Marco 10/06
export type StatusParada = "pendente" | "entregue" | "ausente" | "adiado"

export type Parada = {
  ordem: number
  numero_pedido: string
  nome_cliente: string | null
  endereco: string | null
  cep: string | null
  celular: string | null
  maps_query: string | null
  valor_total: number
  forma_pagamento: string
  ja_pago: boolean
  status: StatusParada
  tentativas: number
}

/**
 * Camada de dados do app de entregas — AGNÓSTICA DE BANCO (Marco 10/06).
 * Hoje lê do JSON da rota cruzada com o Bling. Quando o Marco decidir onde fica
 * o banco (Supabase OU Postgres no Hetzner), SÓ esta função muda — a UI não.
 */
export async function getRota(): Promise<Parada[]> {
  return (rotaJson as any[])
    .map((p) => ({
      ordem: p.ordem,
      numero_pedido: String(p.numero_pedido),
      nome_cliente: p.nome_cliente ?? null,
      endereco: p.endereco ?? null,
      cep: p.cep ?? null,
      celular: p.celular ?? null,
      maps_query: p.maps_query ?? null,
      valor_total: Number(p.valor_total) || 0,
      forma_pagamento: p.forma_pagamento || "",
      ja_pago: !!p.ja_pago,
      status: (p.status as StatusParada) || "pendente",
      tentativas: p.tentativas || 0,
    }))
    .sort((a, b) => a.ordem - b.ordem)
}

export const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)

/** "Dinheiro"/"Crédito"/"Link Pagamento" cobram; "PAC"(site)/"Pago" já pagos */
export function rotuloPagamento(p: Parada): string {
  if (p.ja_pago) return p.forma_pagamento.toLowerCase().includes("pac") ? "Pago no site" : "Já pago"
  return p.forma_pagamento
}
