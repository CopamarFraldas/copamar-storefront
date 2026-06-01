import { NextRequest, NextResponse } from "next/server"

/**
 * Proxy do consultor de frete: o browser não alcança o backend interno
 * (medusa-backend:9000), então o storefront repassa pro endpoint /store/frete
 * (lógica real #9: frota própria por faixa de CEP + Frenet com a lista de
 * modalidades). Server-side, com a publishable key.
 *
 * GET /api/frete-cep?cep=XXXXXXXX[&variant_id=variant_xxx]
 */
export async function GET(req: NextRequest) {
  const cep = (req.nextUrl.searchParams.get("cep") || "").replace(/\D/g, "")
  const variantId = req.nextUrl.searchParams.get("variant_id") || ""
  if (cep.length !== 8) {
    return NextResponse.json({ error: "CEP inválido" }, { status: 400 })
  }

  const base = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  const qs = `cep=${cep}${variantId ? `&variant_id=${encodeURIComponent(variantId)}` : ""}`

  try {
    const r = await fetch(`${base}/store/frete?${qs}`, {
      headers: { "x-publishable-api-key": pk },
      // cotação ao vivo (Frenet) — cache curtinho só pra repique de digitação
      next: { revalidate: 30 },
    })
    const d = await r.json()
    return NextResponse.json(d, { status: r.ok ? 200 : r.status })
  } catch {
    return NextResponse.json({ cep, opcoes: [], sem_cotacao: true })
  }
}
