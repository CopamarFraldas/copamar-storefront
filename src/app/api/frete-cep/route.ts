import { NextRequest, NextResponse } from "next/server"

/**
 * Proxy do consultor de frete: o browser não alcança o backend interno
 * (medusa-backend:9000), então o storefront repassa pro endpoint /store/frete
 * (lógica real #9: frota própria por faixa de CEP + Frenet com a lista de
 * modalidades). Server-side, com a publishable key.
 *
 * GET /api/frete-cep?cep=XXXXXXXX[&variant_id=variant_xxx][&quantity=N][&cart_id=cart_xxx]
 *   - quantity: cota N unidades da variante (PDP — frete que reflete a quantidade)
 *   - cart_id: cota o carrinho REAL (todos os itens × quantidades)
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const cep = (sp.get("cep") || "").replace(/\D/g, "")
  const variantId = sp.get("variant_id") || ""
  const cartId = sp.get("cart_id") || ""
  const quantity = sp.get("quantity") || ""
  if (cep.length !== 8) {
    return NextResponse.json({ error: "CEP inválido" }, { status: 400 })
  }

  const base = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  const params = new URLSearchParams({ cep })
  if (cartId) params.set("cart_id", cartId)
  if (variantId) params.set("variant_id", variantId)
  if (quantity && Number(quantity) > 1) params.set("quantity", quantity)
  // dinâmico (carrinho vivo OU quantidade > 1) → sem cache pra refletir a hora;
  // caso simples (cep[/variante]) mantém cache curtinho contra repique de digitação.
  const dinamico = !!cartId || (Number(quantity) > 1)

  try {
    const r = await fetch(`${base}/store/frete?${params.toString()}`, {
      headers: { "x-publishable-api-key": pk },
      ...(dinamico ? { cache: "no-store" } : { next: { revalidate: 30 } }),
    })
    const d = await r.json()
    return NextResponse.json(d, { status: r.ok ? 200 : r.status })
  } catch {
    return NextResponse.json({ cep, opcoes: [], sem_cotacao: true })
  }
}
