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
  const url =
    `${base}/store/products?q=${encodeURIComponent(q)}&limit=6` +
    `&region_id=${region.id}` +
    `&fields=handle,title,thumbnail,*variants.calculated_price`

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
    return NextResponse.json({ produtos, count: d.count || 0 })
  } catch {
    return NextResponse.json({ produtos: [], count: 0 })
  }
}
