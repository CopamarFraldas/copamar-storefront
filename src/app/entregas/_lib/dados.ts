import rotaJson from "../_data/rota.json"

// pendente | entregue | ausente (ninguém em casa, culpa do cliente, +3 dias) |
// adiado ("deixar pra outro dia" — imprevisto NOSSO, pede desculpa, sem contar
// tentativa contra o cliente) — Marco 10/06
export type StatusParada = "pendente" | "entregue" | "ausente" | "adiado"

export type Parada = {
  id?: number
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

const SUPA = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY

/** data de hoje no fuso BR (UTC-3) — a rota é por dia (data_rota) */
export function hojeBR(): string {
  return new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10)
}

function normaliza(p: any): Parada {
  return {
    id: p.id,
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
  }
}

/**
 * Rota do dia. Lê do Supabase (entregas_frota de HOJE) — a fonte real, populada
 * pelo cruzamento com o Bling. Fallback: JSON anonimizado (dev/sem banco). O git
 * não guarda dado real de cliente; eles vivem no Supabase (Marco 10/06).
 */
export async function getRota(): Promise<Parada[]> {
  if (SUPA && KEY) {
    try {
      const r = await fetch(
        `${SUPA}/rest/v1/entregas_frota?data_rota=eq.${hojeBR()}&order=ordem`,
        { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: "no-store" }
      )
      if (r.ok) {
        const rows = await r.json()
        if (Array.isArray(rows) && rows.length) return rows.map(normaliza)
      }
    } catch {
      /* cai no fallback */
    }
  }
  return (rotaJson as any[]).map(normaliza).sort((a, b) => a.ordem - b.ordem)
}

export const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)

/** "Dinheiro"/"Crédito"/"Link Pagamento" cobram; "PAC"(site)/"Pago" já pagos */
export function rotuloPagamento(p: Parada): string {
  if (p.ja_pago) return p.forma_pagamento.toLowerCase().includes("pac") ? "Pago no site" : "Já pago"
  return p.forma_pagamento
}

/**
 * Templates das mensagens ao cliente (Marco 10/06 — ideias 1 e 2). Aqui (módulo
 * normal), não em acoes.ts ("use server", que só exporta funções async).
 * - sai_hoje: aviso de manhã ("sua entrega sai hoje") → reduz ausência.
 * - entregue: confirmação na hora.  - ausente: ninguém em casa (nova tentativa).
 * - adiado: imprevisto NOSSO → pede desculpa, NÃO conta como tentativa.
 */
export function mensagemCliente(status: string, nome?: string | null): string {
  const oi = nome ? `Oi, ${nome.split(" ")[0]}! ` : "Oi! "
  switch (status) {
    case "sai_hoje":
      return `${oi}🚚 Boa notícia: o seu pedido da Copamar *sai pra entrega hoje* pelos nossos próprios carros. Pode receber em casa ou deixar na portaria, como for melhor pra você 👍`
    case "entregue":
      return `${oi}Seu pedido da Copamar foi *entregue* agora 💙 Obrigado pela confiança! Qualquer coisa, é só chamar.`
    case "ausente":
      return `${oi}Passamos para entregar seu pedido da Copamar, mas não encontramos ninguém pra receber 🚪 Vamos tentar de novo em breve. Se quiser combinar um horário melhor, é só responder aqui!`
    case "adiado":
      return `${oi}Tivemos um contratempo na nossa rota de hoje e o seu pedido da Copamar precisou ser remarcado 🙏 Já está reagendado — e *quando ele sair pra entrega de novo, a gente te avisa por aqui*. Desculpe o transtorno; qualquer coisa, é só responder! 💙`
    default:
      return ""
  }
}
