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
  gps_lat: number | null
  gps_long: number | null
  aviso_sai_hoje_em: string | null
  instrucao_cliente: string | null
  dest_lat: number | null
  dest_long: number | null
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
    gps_lat: typeof p.gps_lat === "number" ? p.gps_lat : null,
    gps_long: typeof p.gps_long === "number" ? p.gps_long : null,
    aviso_sai_hoje_em: p.aviso_sai_hoje_em ?? null,
    instrucao_cliente: p.instrucao_cliente ?? null,
    dest_lat: typeof p.dest_lat === "number" ? p.dest_lat : null,
    dest_long: typeof p.dest_long === "number" ? p.dest_long : null,
  }
}

/**
 * Rota do dia. Lê do Supabase (entregas_frota de HOJE) — a fonte real, populada
 * pelo cruzamento com o Bling. Sem rota importada (ou erro) → lista VAZIA, e a
 * tela mostra "sem rota hoje" — NUNCA a rota demo: o Dedé não pode ver paradas
 * falsas em produção (auditoria 11/06). O JSON anonimizado fica só pra dev sem
 * banco configurado. Dado real de cliente vive no Supabase, não no git.
 */
export async function getRota(motoristaId?: string | null): Promise<Parada[]> {
  if (!SUPA || !KEY) {
    // dev sem banco: rota demo anonimizada
    return (rotaJson as any[]).map(normaliza).sort((a, b) => a.ordem - b.ordem)
  }
  try {
    // multi-motorista (24/06): a PÁGINA passa o motorista logado → rota só dele
    // (Lalamove tem motorista próprio, então não cai na rota de ninguém). Sem id
    // (ex.: "avisar a rota" do admin) = todas as paradas do dia.
    const filtroMot = motoristaId
      ? `&motorista=eq.${encodeURIComponent(motoristaId)}`
      : ""
    const r = await fetch(
      `${SUPA}/rest/v1/entregas_frota?data_rota=eq.${hojeBR()}${filtroMot}&order=ordem`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: "no-store" }
    )
    if (r.ok) {
      const rows = await r.json()
      if (Array.isArray(rows)) return rows.map(normaliza)
    }
  } catch {
    /* erro de rede → vazio (tela "sem rota") */
  }
  return []
}

/**
 * URL exibível da foto do comprovante. Aceita o PATH no bucket (formato novo) ou
 * a URL pública antiga. Bucket é PRIVADO (LGPD, Marco 11/06): gera signed URL de
 * 7 DIAS — dá pra encaminhar o link (chargeback, cliente) e a pessoa ver com
 * calma; abrir o comprovante de novo gera um link novo de 7 dias.
 */
export async function fotoComprovante(fotoRef: string | null): Promise<string | null> {
  if (!fotoRef || !SUPA || !KEY) return fotoRef
  const path = fotoRef.startsWith("http")
    ? decodeURIComponent(fotoRef.split("/comprovantes/")[1] || "")
    : fotoRef
  if (!path) return fotoRef
  // 2 tentativas: falha transitória da assinatura não pode virar "Sem foto"
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      const r = await fetch(`${SUPA}/storage/v1/object/sign/comprovantes/${path}`, {
        method: "POST",
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ expiresIn: 7 * 24 * 3600 }),
      })
      if (r.ok) {
        const j = await r.json()
        if (j?.signedURL) return `${SUPA}/storage/v1${j.signedURL}`
      }
      if (r.status === 400 || r.status === 404) break // objeto não existe (ex.: tentativa >7d apagada)
    } catch {
      /* tenta de novo */
    }
  }
  return fotoRef.startsWith("http") ? fotoRef : null
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
export function mensagemCliente(status: string, nome?: string | null, qtd = 1): string {
  // nomes do Bling vêm em CAIXA ALTA — capitaliza o primeiro ("Oi, Benedita!")
  const pn = (nome || "").trim().split(" ")[0]
  const bonito = pn ? pn[0].toUpperCase() + pn.slice(1).toLowerCase() : ""
  const oi = bonito ? `Oi, ${bonito}! ` : "Oi! "
  switch (status) {
    case "sai_hoje": {
      // boa notícia + CONVITE a instruções (Marco 15/06): não precisa responder,
      // mas se não tiver quem receba OU tiver instrução pro entregador, o cliente
      // manda aqui e a gente repassa (vira p.instrucao_cliente na tela do Dedé,
      // via fast-path da MAPA). Convite ≠ pergunta — substitui a regra antiga
      // "sem opções" (caso Elcia 11/06): lá o problema era OFERECER portaria/casa
      // (gerava dúvida); aqui é só uma porta aberta caso precise. Vários pedidos
      // da mesma pessoa (caso Inovha 12/06) = 1 mensagem no plural.
      const base =
        qtd > 1
          ? `${oi}🚚 Boa notícia: os seus ${qtd} pedidos da Copamar *saem pra entrega hoje* pelos nossos próprios carros! 😊`
          : `${oi}🚚 Boa notícia: o seu pedido da Copamar *sai pra entrega hoje* pelos nossos próprios carros! 😊`
      return `${base}\n\nNão precisa responder a essa mensagem 🙂 Mas se por acaso não tiver ninguém pra receber, ou tiver alguma instrução pro entregador, é só mandar por aqui que a gente avisa o motorista. 🙌`
    }
    case "entregue":
      return `${oi}Seu pedido da Copamar foi *entregue* agora 💙 Obrigado pela confiança! Qualquer coisa, é só chamar.`
    case "ausente":
      // Marco 22/06: setar expectativa de ~2 dias. Os carros revezam as regiões
      // a cada dia (1 dia zona sul, outro zona leste), então só voltamos à mesma
      // região em 2 dias úteis (ex.: ausência na segunda → nova tentativa quarta).
      // "úteis" pra não prometer fim de semana; + rede de segurança = avisamos
      // quando sair de novo (casa com o aviso "sai_hoje" da manhã).
      return `${oi}Passamos para entregar seu pedido da Copamar, mas não encontramos ninguém pra receber 🚪 Como nossos carros revezam as regiões da cidade a cada dia, a próxima tentativa é *daqui a 2 dias úteis* — e a gente te avisa por aqui assim que ele sair de novo 🙌 Se quiser combinar um horário melhor, é só responder!`
    case "adiado":
      return `${oi}Tivemos um contratempo na nossa rota de hoje e o seu pedido da Copamar precisou ser remarcado 🙏 Já está reagendado — e *quando ele sair pra entrega de novo, a gente te avisa por aqui*. Desculpe o transtorno; qualquer coisa, é só responder! 💙`
    default:
      return ""
  }
}
