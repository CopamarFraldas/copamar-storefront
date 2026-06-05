import { NextRequest, NextResponse } from "next/server"
import { getRegion } from "@lib/data/regions"

/**
 * Sugestões de busca (autocomplete) — roda NO STOREFRONT (sem endpoint novo no
 * backend → OOM-safe). Reusa a store API do Medusa (?q nativo) e devolve só o
 * enxuto que o dropdown precisa: handle, título, thumbnail e menor preço.
 *
 * GET /api/search-suggest?q=tena&cc=br  →  { produtos: [...], count }
 */
const menorPreco = (variants: any[]): { amount: number; currency: string } | null => {
  let min: number | null = null
  let cur = "brl"
  for (const v of variants || []) {
    const cp = v?.calculated_price
    const amt = cp?.calculated_amount
    if (typeof amt === "number" && (min === null || amt < min)) {
      min = amt
      cur = cp?.currency_code || cur
    }
  }
  return min === null ? null : { amount: min, currency: cur }
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim()
  const cc = req.nextUrl.searchParams.get("cc") || "br"

  // 2+ caracteres pra valer a pena consultar
  if (q.length < 2) return NextResponse.json({ produtos: [], count: 0 })

  const region = await getRegion(cc)
  if (!region) return NextResponse.json({ produtos: [], count: 0 })

  const base = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

  // busca ACENTO-INSENSÍVEL: ids via /store/busca (unaccent) e hidrata por id[].
  // Se o endpoint falhar, cai no ?q nativo (comportamento antigo).
  let url =
    `${base}/store/products?q=${encodeURIComponent(q)}&limit=6` +
    `&region_id=${region.id}` +
    `&fields=handle,title,thumbnail,*variants.calculated_price`
  let countUnaccent: number | null = null
  try {
    const rb = await fetch(`${base}/store/busca?q=${encodeURIComponent(q)}&limit=6`, {
      headers: { "x-publishable-api-key": pk },
      next: { revalidate: 60 },
    })
    if (rb.ok) {
      const db = await rb.json()
      if (Array.isArray(db.ids)) {
        countUnaccent = db.count ?? db.ids.length
        if (db.ids.length === 0) return NextResponse.json({ produtos: [], count: 0 })
        url =
          `${base}/store/products?${db.ids.map((i: string) => `id[]=${i}`).join("&")}` +
          `&limit=6&region_id=${region.id}` +
          `&fields=handle,title,thumbnail,*variants.calculated_price`
      }
    }
  } catch { /* fallback ?q */ }

  try {
    const r = await fetch(url, {
      headers: { "x-publishable-api-key": pk },
      next: { revalidate: 60 },
    })
    if (!r.ok) return NextResponse.json({ produtos: [], count: 0 })
    const d = await r.json()
    const produtos = (d.products || []).map((p: any) => ({
      handle: p.handle,
      title: p.title,
      thumbnail: p.thumbnail || null,
      preco: menorPreco(p.variants),
    }))
    return NextResponse.json({ produtos, count: countUnaccent ?? (d.count || 0) })
  } catch {
    return NextResponse.json({ produtos: [], count: 0 })
  }
}
