import { NextResponse } from "next/server"

/**
 * Proxy da config do cashback (padrão chega-amanha): o browser não alcança o
 * backend interno (medusa-backend:9000), então o storefront repassa pro
 * /store/cashback/config. Contrato: { ativo: boolean, percentual: number }.
 *
 * Usado pelo selo "💰 Este pedido gera R$ X de cashback" no resumo do
 * carrinho/checkout. O kill-switch CASHBACK_ATIVO mora em copamar_kv e o Marco
 * liga/desliga no admin — por isso no-store (o valor vira a qualquer momento).
 * Fail-CLOSED: qualquer falha → { ativo: false } e o site fica em silêncio
 * (o programa nasce DESLIGADO; nunca prometer cashback por engano).
 *
 * GET /api/cashback-config
 */
export async function GET() {
  const base = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

  try {
    const r = await fetch(`${base}/store/cashback/config`, {
      headers: { "x-publishable-api-key": pk },
      cache: "no-store",
    })
    if (!r.ok) {
      return NextResponse.json({ ativo: false })
    }
    const d = await r.json()
    return NextResponse.json({
      ativo: d?.ativo === true,
      percentual:
        typeof d?.percentual === "number" && d.percentual > 0
          ? d.percentual
          : 1,
    })
  } catch {
    return NextResponse.json({ ativo: false })
  }
}
