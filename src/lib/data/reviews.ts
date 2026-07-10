import "server-only"

/**
 * Agregados de avaliações first-party (copamar_reviews) em LOTE — pros cards
 * da vitrine/trilhos e pro JSON-LD da PDP. UMA chamada por listing (nunca por
 * card), server-side pela URL interna do docker. Falhou → {} e os cards saem
 * sem estrelas (nunca quebra a página).
 */

export type ReviewsAgg = { media: number; total: number }

/** Avaliação PUBLICADA como o backend expõe (nome já exibível: "Maria S."). */
export type ReviewPublica = {
  nome: string
  rating: number
  comentario: string
  verificada: boolean
  created_at: string
}

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

/**
 * Agregado + avaliações publicadas de UM produto — pro JSON-LD da PDP
 * (aggregateRating + até 3 `review`). MESMA fonte da seção AvaliacoesProduto
 * (GET /store/reviews/:id), mas server-side e CACHEADA (revalidate 300, igual
 * ao agregado dos cards) pra não derrubar o cache da PDP — a seção visível
 * segue client-side/no-store e sempre fresca. Falhou → agregado null e lista
 * vazia (JSON-LD sai sem rating, nunca quebra a página).
 */
export async function getReviewsProduto(
  productId: string | undefined | null
): Promise<{ agregado: ReviewsAgg | null; avaliacoes: ReviewPublica[] }> {
  const vazio = { agregado: null, avaliacoes: [] as ReviewPublica[] }
  if (!productId) return vazio

  const base = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  try {
    const r = await fetch(
      `${base}/store/reviews/${encodeURIComponent(productId)}`,
      {
        headers: { "x-publishable-api-key": pk },
        next: { revalidate: 300 },
      }
    )
    if (!r.ok) return vazio
    const d = await r.json()
    const total = Number(d?.agregado?.total ?? 0)
    return {
      // total 0 → null (mesma semântica do reviewsAgg dos cards: sem estrelas)
      agregado:
        total > 0 ? { media: Number(d.agregado.media), total } : null,
      avaliacoes: Array.isArray(d?.avaliacoes) ? d.avaliacoes : [],
    }
  } catch {
    return vazio
  }
}
