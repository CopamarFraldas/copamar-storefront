import { NextRequest, NextResponse } from "next/server"

/**
 * Proxy das avaliações de produto: o browser NUNCA fala com o backend
 * (Caddy bloqueia /store de fora; o backend só é alcançável pela URL interna
 * do docker). A PDP é cacheada → a seção de avaliações busca client-side por
 * AQUI, sempre fresca (no-store).
 *
 * GET  /api/reviews/:productId → lista + agregado (+ `minha` e `logado` se
 *      houver sessão — repassa o JWT do cookie _medusa_jwt como Authorization)
 * POST /api/reviews/:productId { rating, comentario } → cria/edita (upsert).
 *      Sem cookie → 401 { erro: "faça login" } sem nem bater no backend.
 */

const BASE = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

type Ctx = { params: Promise<{ productId: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  const { productId } = await ctx.params
  if (!productId) {
    return NextResponse.json({ erro: "produto inválido" }, { status: 400 })
  }
  const jwt = req.cookies.get("_medusa_jwt")?.value
  try {
    const r = await fetch(`${BASE}/store/reviews/${encodeURIComponent(productId)}`, {
      headers: {
        "x-publishable-api-key": PK,
        ...(jwt ? { authorization: `Bearer ${jwt}` } : {}),
      },
      cache: "no-store",
    })
    const d = await r.json().catch(() => ({}))
    // `logado` = tem sessão (o form da PDP decide entre convite e formulário)
    return NextResponse.json({ ...d, logado: !!jwt }, { status: r.ok ? 200 : r.status })
  } catch {
    return NextResponse.json({ erro: "avaliações indisponíveis" }, { status: 502 })
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { productId } = await ctx.params
  if (!productId) {
    return NextResponse.json({ erro: "produto inválido" }, { status: 400 })
  }
  const jwt = req.cookies.get("_medusa_jwt")?.value
  if (!jwt) {
    return NextResponse.json({ erro: "faça login" }, { status: 401 })
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 })
  }

  try {
    const r = await fetch(`${BASE}/store/reviews/${encodeURIComponent(productId)}`, {
      method: "POST",
      headers: {
        "x-publishable-api-key": PK,
        authorization: `Bearer ${jwt}`,
        "content-type": "application/json",
      },
      // só repassa o que a rota entende (nada de campos extras do cliente)
      body: JSON.stringify({ rating: body?.rating, comentario: body?.comentario }),
      cache: "no-store",
    })
    const d = await r.json().catch(() => ({}))
    if (r.status === 401) {
      return NextResponse.json({ erro: "faça login" }, { status: 401 })
    }
    return NextResponse.json(d, { status: r.ok ? 200 : r.status })
  } catch {
    return NextResponse.json({ erro: "não foi possível salvar" }, { status: 502 })
  }
}
