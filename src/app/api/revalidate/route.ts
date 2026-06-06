import { timingSafeEqual } from "crypto"
import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/revalidate?tags=products — invalidação de cache disparada pelo
 * BACKEND (#46 anti-oversell): a sync de estoque Bling→Medusa (15min) chama
 * aqui quando algum saldo MUDOU, pro site refletir o estoque novo na hora
 * (sem isso, card/PDP poderiam mostrar "em estoque" de produto já esgotado).
 *
 * Auth: header x-revalidate-secret === env REVALIDATE_SECRET (obrigatória —
 * sem a env, a rota nega tudo). Só aceita tags de uma allowlist.
 */
const TAGS_PERMITIDAS = new Set(["products", "collections", "categories", "regions"])

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret") || ""
  const esperado = process.env.REVALIDATE_SECRET || ""
  // comparação em tempo constante (review 06/06); Uint8Array evita o atrito
  // de types Buffer×ArrayBufferView do TS do projeto
  const enc = new TextEncoder()
  const a = enc.encode(secret)
  const b = enc.encode(esperado)
  if (!esperado || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const pedidas = (req.nextUrl.searchParams.get("tags") || "products")
    .split(",")
    .map((t) => t.trim())
    .filter((t) => TAGS_PERMITIDAS.has(t))

  if (!pedidas.length) {
    return NextResponse.json({ ok: false, error: "nenhuma tag válida" }, { status: 400 })
  }

  for (const tag of pedidas) revalidateTag(tag)
  return NextResponse.json({ ok: true, revalidated: pedidas })
}
