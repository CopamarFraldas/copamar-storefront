import { NextRequest, NextResponse } from "next/server"

/**
 * Proxy de LEITURA das perguntas e respostas da PDP: o browser NUNCA fala com
 * o backend (Caddy bloqueia /store de fora; o backend só é alcançável pela
 * URL interna do docker — mesmo desenho do /api/reviews). A PDP é cacheada →
 * a seção de perguntas busca client-side por AQUI, sempre fresca (no-store).
 *
 * GET /api/perguntas/:productId → { perguntas: [...] } (só as PUBLICADAS —
 * o backend /store/perguntas/:productId filtra por status).
 *
 * A ESCRITA não passa por aqui: o form usa o server action
 * enviarPerguntaProduto (@lib/data/perguntas), que sanitiza e rate-limita.
 */

const BASE = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

type Ctx = { params: Promise<{ productId: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { productId } = await ctx.params
  if (!productId) {
    return NextResponse.json({ erro: "produto inválido" }, { status: 400 })
  }
  try {
    const r = await fetch(
      `${BASE}/store/perguntas/${encodeURIComponent(productId)}`,
      {
        headers: { "x-publishable-api-key": PK },
        cache: "no-store",
      }
    )
    const d = await r.json().catch(() => ({}))
    return NextResponse.json(d, { status: r.ok ? 200 : r.status })
  } catch {
    return NextResponse.json({ erro: "perguntas indisponíveis" }, { status: 502 })
  }
}
