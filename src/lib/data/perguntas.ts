"use server"

import { cookies, headers } from "next/headers"

/**
 * Perguntas e respostas da PDP (estilo Amazon) — tabela perguntas_produto no
 * Postgres do Medusa, via rota interna /store/perguntas/:productId (o browser
 * NUNCA fala com o backend; Caddy bloqueia /store de fora — mesmo desenho do
 * /api/reviews). A pergunta entra como 'pendente' e só aparece na PDP depois
 * que a equipe revisa e responde (status 'publicada').
 *
 * Este server action é a porta de ESCRITA: sanitize + rate limit simples por
 * IP/sessão ANTES de encostar no backend. A leitura fica no proxy GET
 * /api/perguntas/:productId (client-side, sempre fresca — a PDP é cacheada).
 */

const BASE = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

// ── rate limit simples em memória (por processo Next — suficiente pra conter
//    rajada/spam de form; o backend ainda tem dedupe + teto da fila) ──
const JANELA_MS = 10 * 60 * 1000 // 10 minutos
const MAX_NA_JANELA = 3
const envios = new Map<string, number[]>()

function estourouLimite(chave: string): boolean {
  const agora = Date.now()
  const lista = (envios.get(chave) || []).filter((t) => agora - t < JANELA_MS)
  if (lista.length >= MAX_NA_JANELA) {
    envios.set(chave, lista)
    return true
  }
  lista.push(agora)
  envios.set(chave, lista)
  // faxina ocasional pro Map não crescer pra sempre
  if (envios.size > 2000) {
    envios.forEach((v, k) => {
      if (v.every((t) => agora - t >= JANELA_MS)) envios.delete(k)
    })
  }
  return false
}

/** IP real (atrás do Cloudflare) + cookie de sessão do carrinho quando houver */
async function chaveCliente(): Promise<string> {
  let ip = ""
  let sessao = ""
  try {
    const h = await headers()
    ip =
      h.get("cf-connecting-ip") ||
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      ""
  } catch {}
  try {
    sessao = (await cookies()).get("_medusa_cart_id")?.value || ""
  } catch {}
  return `${ip}|${sessao}` || "anon"
}

/** tira HTML e normaliza (o backend re-sanitiza — defesa em profundidade) */
function limpa(v: unknown, max: number): string {
  return String(typeof v === "string" ? v : "")
    .replace(/<[^>]*>/g, "")
    .replace(/\r/g, "")
    .trim()
    .slice(0, max)
}

export type ResultadoPergunta = { ok: true } | { ok: false; erro: string }

export async function enviarPerguntaProduto(dados: {
  productId: string
  handle?: string
  pergunta: string
  nome: string
  celular?: string
}): Promise<ResultadoPergunta> {
  try {
    const productId = String(dados?.productId || "").trim()
    if (!productId) {
      return { ok: false, erro: "Produto inválido — recarregue a página." }
    }

    const pergunta = limpa(dados?.pergunta, 1000)
    if (pergunta.length < 5) {
      return { ok: false, erro: "Escreva sua pergunta (pelo menos 5 letras)." }
    }
    const nome = limpa(dados?.nome, 80)
    if (nome.length < 2) {
      return { ok: false, erro: "Diga seu nome (pode ser só o primeiro)." }
    }
    // WhatsApp é opcional; se preencheu, tem que ter DDD + número (10-13 dígitos)
    const celular = String(dados?.celular || "").replace(/\D/g, "")
    if (celular && (celular.length < 10 || celular.length > 13)) {
      return {
        ok: false,
        erro: "Confira o WhatsApp (DDD + número) — ou deixe em branco.",
      }
    }

    if (estourouLimite(await chaveCliente())) {
      return {
        ok: false,
        erro: "Você já enviou algumas perguntas há pouco. Aguarde alguns minutos e tente de novo.",
      }
    }

    const r = await fetch(
      `${BASE}/store/perguntas/${encodeURIComponent(productId)}`,
      {
        method: "POST",
        headers: {
          "x-publishable-api-key": PK,
          "content-type": "application/json",
        },
        // só o que a rota entende (nada de campo extra vindo do browser)
        body: JSON.stringify({
          pergunta,
          nome,
          celular: celular || undefined,
          handle: limpa(dados?.handle, 120) || undefined,
        }),
        cache: "no-store",
      }
    )
    if (!r.ok) {
      const d = await r.json().catch(() => ({} as any))
      return {
        ok: false,
        erro:
          (d as any)?.message || "Não foi possível enviar agora. Tente de novo.",
      }
    }
    return { ok: true }
  } catch {
    return { ok: false, erro: "Não foi possível enviar agora. Tente de novo." }
  }
}
