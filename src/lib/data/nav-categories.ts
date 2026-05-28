import { listCategories } from "./categories"

/**
 * Whitelist das 8 categorias pai que aparecem no Mega Menu, na ordem de exibição.
 * Importante: handles do BANCO (validei contra `SELECT handle FROM product_category`).
 * Nota: roupa-intima é o handle real (não roupa-intima-pants do briefing).
 */
const RAIZES = [
  "fraldas-geriatricas",
  "roupa-intima",
  "higiene",
  "absorvente-geriatrico",
  "absorvente-feminino",
  "absorvente-masculino",
  "fralda-infantil",
  "protetores-de-cama",
] as const

export type NavSub = { handle: string; name: string; count: number }
export type NavCat = { handle: string; name: string; count: number; subs: NavSub[] }

/**
 * Retorna as 8 categorias do menu com nome, handle, contagem de produtos
 * e subcategorias (também com contagem). Tudo lido do banco em runtime —
 * sem hardcode. Se a query falhar, retorna [] (header não quebra).
 */
export async function getNavCategories(): Promise<NavCat[]> {
  try {
    // Reusa o listCategories padrão (já traz *category_children + *products).
    const all: any[] = (await listCategories()) || []
    if (!all.length) return []

    const byHandle = new Map<string, any>()
    for (const c of all) byHandle.set(c.handle, c)

    const result: NavCat[] = []
    for (const h of RAIZES) {
      const c = byHandle.get(h)
      if (!c) continue // categoria não existe no banco → pula (não quebra)
      const subs: NavSub[] = (c.category_children || [])
        .map((child: any) => byHandle.get(child.handle))
        .filter(Boolean)
        .map((s: any) => ({
          handle: s.handle,
          name: s.name,
          count: (s.products || []).length,
        }))
        .sort((a: NavSub, b: NavSub) => a.name.localeCompare(b.name, "pt-BR"))
      result.push({
        handle: c.handle,
        name: c.name,
        count: (c.products || []).length,
        subs,
      })
    }
    return result
  } catch {
    return [] // fallback: sem contagens, sem categorias — header não quebra
  }
}
