/**
 * Eventos de e-commerce do GA4 (auditoria 02/07) — o GA4 só recebia page_view,
 * então funil/receita ficavam invisíveis e o Ads sem audiência de remarketing
 * dinâmico. Helpers client-only: empurram pro gtag que o GoogleAdsTag já
 * instala (Consent Mode v2 — com analytics_storage negado o Google segue
 * medindo por modelagem, sem cookie; nada aqui fura o consent).
 *
 * item_id = SKU da variante (EAN/GTIN) — a MESMA chave que o feed.xml do
 * Merchant usa como g:id, pro remarketing dinâmico casar evento ↔ catálogo.
 */

export type Ga4Item = {
  item_id: string
  item_name: string
  price?: number
  quantity?: number
}

// 2 casas: soma de floats gera 39.900000000000006 e o GA4 registra isso cru
export const arred2 = (v: unknown): number =>
  Math.round((Number(v) || 0) * 100) / 100

/** Dispara um evento GA4. No-op no SSR ou sem gtag (GADS_ID vazio). */
export function ga4Event(nome: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined") return
  const g = (window as any).gtag
  if (typeof g !== "function") return
  g("event", nome, { currency: "BRL", ...params })
}

/** Normaliza um item pro formato do GA4 (item_id/item_name/price/quantity). */
export function ga4Item(i: Ga4Item): Ga4Item {
  return {
    item_id: String(i.item_id ?? ""),
    item_name: String(i.item_name ?? ""),
    ...(i.price != null ? { price: arred2(i.price) } : {}),
    quantity: Math.max(1, Number(i.quantity) || 1),
  }
}

/**
 * Converte um line item do Medusa (cart OU order — ambos vêm com
 * *items.variant nos fields) pro item do GA4. unit_price no Medusa v2 já é
 * em REAIS (não centavos — ver memória do frete).
 */
export function ga4ItemDeLineItem(li: any): Ga4Item {
  return ga4Item({
    item_id:
      li?.variant?.sku || li?.variant_sku || li?.product_handle || li?.id,
    item_name: li?.product_title || li?.title || "",
    price: li?.unit_price,
    quantity: li?.quantity,
  })
}

/** value padrão do GA4 = Σ price×quantity dos itens. */
export function ga4Value(items: Ga4Item[]): number {
  return arred2(
    items.reduce(
      (s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1),
      0
    )
  )
}

/** add_to_cart — chamado no clique (ProductActions), com a variante escolhida. */
export function ga4AddToCart(item: Ga4Item) {
  const it = ga4Item(item)
  ga4Event("add_to_cart", { value: ga4Value([it]), items: [it] })
}
