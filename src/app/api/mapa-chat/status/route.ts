import { NextResponse } from "next/server"

/**
 * Status do chat da MAPA no site (guardrail do WhatsApp restrito).
 *
 * O widget pergunta aqui se o chat deve aparecer; a fonte da verdade é o crew
 * (GET {MAPA_CHAT_URL}/site/chat/status → {ativo, motivo}). Proxy server-side:
 * a URL interna NUNCA chega ao browser — devolvemos só {ativo} (nem o "motivo"
 * vaza, é diagnóstico interno do crew).
 *
 * Cache em memória de 60s (por processo) pra não martelar o crew a cada
 * page view; crew fora do ar ou lento (>3s) → {ativo:false} e o site segue
 * vivo sem o chat (fail-closed, também cacheado 60s pra não repicar).
 */

// GET sem uso de request seria estático no App Router → congela o status no
// build. Força dinâmico: o valor muda conforme o crew liga/desliga o failover.
export const dynamic = "force-dynamic"

const TTL_MS = 60_000
const TIMEOUT_MS = 3_000

let cache: { ativo: boolean; ts: number } | null = null

export async function GET() {
  const agora = Date.now()
  if (cache && agora - cache.ts < TTL_MS) {
    return NextResponse.json({ ativo: cache.ativo })
  }

  let ativo = false
  const base = process.env.MAPA_CHAT_URL
  if (base) {
    try {
      const r = await fetch(`${base}/site/chat/status`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      })
      if (r.ok) {
        const j = (await r.json().catch(() => null)) as {
          ativo?: unknown
        } | null
        ativo = j?.ativo === true
      }
    } catch {
      // timeout / crew fora do ar → chat oculto (fail-closed)
    }
  }

  cache = { ativo, ts: agora }
  return NextResponse.json({ ativo })
}
