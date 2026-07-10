import { NextRequest, NextResponse } from "next/server"

/**
 * Proxy da promessa "Chega AMANHÃ": o browser não alcança o backend interno
 * (medusa-backend:9000), então o storefront repassa pro /store/chega-amanha.
 * Contrato do backend: { chega_amanha: boolean, cutoff_hora: number }.
 *
 * IMPORTANTE: o CORTE do horário é calculado no SERVIDOR (a API já devolve
 * chega_amanha=false depois do cutoff / fora da zona / feature desligada).
 * Aqui a gente só repassa — sem cache (no-store), porque o valor vira ao
 * cruzar o horário de corte e quando o Marco liga/desliga no admin.
 * Qualquer falha vira { chega_amanha: false } → o site fica em silêncio.
 *
 * GET /api/chega-amanha?cep=XXXXXXXX
 */
export async function GET(req: NextRequest) {
  const cep = (req.nextUrl.searchParams.get("cep") || "").replace(/\D/g, "")
  if (cep.length !== 8) {
    return NextResponse.json({ chega_amanha: false }, { status: 400 })
  }

  const base = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

  try {
    const r = await fetch(`${base}/store/chega-amanha?cep=${cep}`, {
      headers: { "x-publishable-api-key": pk },
      cache: "no-store",
    })
    if (!r.ok) {
      return NextResponse.json({ chega_amanha: false })
    }
    const d = await r.json()
    return NextResponse.json({
      chega_amanha: d?.chega_amanha === true,
      cutoff_hora: typeof d?.cutoff_hora === "number" ? d.cutoff_hora : null,
    })
  } catch {
    return NextResponse.json({ chega_amanha: false })
  }
}
