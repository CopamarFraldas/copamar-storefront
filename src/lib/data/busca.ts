"use server"

/**
 * Busca acento-insensível (#busca, Marco 05/06): pergunta os IDs ao endpoint
 * /store/busca (unaccent no Postgres) e o chamador re-hidrata os cards via
 * /store/products com id[] — preço/estoque/região no pipeline normal.
 * Fallback: se o endpoint falhar, retorna null e o chamador usa o ?q nativo.
 */
export async function buscarIdsProdutos(
  q: string,
  limit = 24
): Promise<{ ids: string[]; count: number } | null> {
  const base = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  try {
    const r = await fetch(
      `${base}/store/busca?q=${encodeURIComponent(q)}&limit=${limit}`,
      {
        headers: { "x-publishable-api-key": pk },
        next: { revalidate: 60 },
      }
    )
    if (!r.ok) return null
    const d = await r.json()
    if (!Array.isArray(d.ids)) return null
    return { ids: d.ids, count: d.count ?? d.ids.length }
  } catch {
    return null
  }
}

/**
 * IDs dos produtos de uma FAMÍLIA (match exato em metadata.familia, via
 * /store/busca?familia=) — usado pelos "tamanhos irmãos" da PDP (06/06):
 * a busca por substring do título perdia famílias cujo slug pula palavras
 * ("lencol adultcare" × "Lençol Descartável Adultcare"). Null = indisponível
 * (o chamador usa o fallback textual).
 */
export async function buscarIdsPorFamilia(
  familia: string,
  limit = 30
): Promise<string[] | null> {
  const base = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  try {
    const r = await fetch(
      `${base}/store/busca?familia=${encodeURIComponent(familia)}&limit=${limit}`,
      {
        headers: { "x-publishable-api-key": pk },
        next: { revalidate: 300, tags: ["products"] },
      }
    )
    if (!r.ok) return null
    const d = await r.json()
    return Array.isArray(d.ids) ? d.ids : null
  } catch {
    return null
  }
}
