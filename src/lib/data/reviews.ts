import "server-only"

/**
 * Agregados de avaliações first-party (copamar_reviews) em LOTE — pros cards
 * da vitrine/trilhos e pro JSON-LD da PDP. UMA chamada por listing (nunca por
 * card), server-side pela URL interna do docker. Falhou → {} e os cards saem
 * sem estrelas (nunca quebra a página).
 */

export type ReviewsAgg = { media: number; total: number }

export async function getReviewsAggregates(
  productIds: (string | undefined | null)[]
): Promise<Record<string, ReviewsAgg>> {
  const ids = Array.from(new Set(productIds.filter(Boolean))) as string[]
  if (!ids.length) return {}

  const base = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  try {
    const r = await fetch(
      `${base}/store/reviews?product_ids=${encodeURIComponent(ids.join(","))}`,
      {
        headers: { "x-publishable-api-key": pk },
        // agregado pode ficar 5 min "atrasado" nos cards sem dor — a seção da
        // PDP (client-side, no-store) é quem mostra o número fresco
        next: { revalidate: 300 },
      }
    )
    if (!r.ok) return {}
    const d = await r.json()
    return d?.agregados || {}
  } catch {
    return {}
  }
}
