import { NextRequest, NextResponse } from "next/server"

/**
 * Proxy da região de ENTREGA PRÓPRIA: o browser não alcança o backend interno
 * (medusa-backend:9000), então o storefront repassa pro /store/regiao-propria.
 * Contrato do backend: { regiao_propria: boolean } — true quando o CEP cai
 * nas faixas de `fretes_ceps` (mesma fonte da verdade do frete próprio #9).
 *
 * Usado pelo selo "Errou o tamanho? A gente troca!" da PDP. As faixas quase
 * não mudam → cache curto (5min) segura o repique de navegação entre PDPs.
 * Qualquer falha vira { regiao_propria: false } → o site fica em silêncio
 * (nunca promete troca na visita pra quem está fora da região).
 *
 * GET /api/regiao-propria?cep=XXXXXXXX
 */
export async function GET(req: NextRequest) {
  const cep = (req.nextUrl.searchParams.get("cep") || "").replace(/\D/g, "")
  if (cep.length !== 8) {
    return NextResponse.json({ regiao_propria: false }, { status: 400 })
  }

  const base = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

  try {
    const r = await fetch(`${base}/store/regiao-propria?cep=${cep}`, {
      headers: { "x-publishable-api-key": pk },
      next: { revalidate: 300 },
    })
    if (!r.ok) {
      return NextResponse.json({ regiao_propria: false })
    }
    const d = await r.json()
    return NextResponse.json({ regiao_propria: d?.regiao_propria === true })
  } catch {
    return NextResponse.json({ regiao_propria: false })
  }
}
