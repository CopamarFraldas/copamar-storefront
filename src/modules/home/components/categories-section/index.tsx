import { getNavCategories } from "@lib/data/nav-categories"
import CategoriesSectionClient from "./categories-section-client"

const PK_HEADER = "x-publishable-api-key"

// produto representativo de cada categoria (escolha curada pelo Marco + validada).
// Pra cada handle de categoria pai, qual handle/título usar pra puxar o thumbnail.
const REPRESENTATIVES: Record<string, string[]> = {
  "fraldas-geriatricas": ["Tena Confort", "Tena Slip Dermacare"],
  "roupa-intima":         ["Tena Pants Confort"],
  "absorvente-geriatrico":["Adultcare Premium", "Adultcare"],
  "absorvente-feminino":  ["Tena Lady Discreet"],
  "absorvente-masculino": ["Tena Men Level 3", "Tena Men"],
  "higiene":              ["Luva Nitr", "Toalha Tena Dermacare"],
  "fralda-infantil":      ["Enzzo Baby Hiper"],
  "protetores-de-cama":   ["Adultcare", "Abena Abri-Soft", "Lençol"],
}

const ORDEM = [
  "fraldas-geriatricas",
  "roupa-intima",
  "absorvente-geriatrico",
  "absorvente-feminino",
  "absorvente-masculino",
  "higiene",
  "fralda-infantil",
  "protetores-de-cama",
]

async function getThumbnailsPorCategoria(): Promise<Record<string, string | null>> {
  // busca server-side (mesma origin do storefront, sem PK aqui — usa backend interno)
  const apiBase = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  try {
    const res = await fetch(
      `${apiBase}/store/products?limit=100&fields=handle,title,thumbnail,*categories`,
      { headers: { [PK_HEADER]: pk }, next: { revalidate: 600 } }
    )
    if (!res.ok) return {}
    const data = await res.json()
    const ps = data.products || []
    const out: Record<string, string | null> = {}
    for (const [cat, prefs] of Object.entries(REPRESENTATIVES)) {
      let escolhido: string | null = null
      for (const pref of prefs) {
        const match = ps.find(
          (p: any) =>
            p.title?.toLowerCase().includes(pref.toLowerCase()) &&
            (p.categories || []).some((c: any) => c.handle === cat) &&
            (p.thumbnail || "").startsWith("http")
        )
        if (match) { escolhido = match.thumbnail; break }
      }
      // fallback: qualquer produto da categoria com thumbnail
      if (!escolhido) {
        const qq = ps.find(
          (p: any) =>
            (p.categories || []).some((c: any) => c.handle === cat) &&
            (p.thumbnail || "").startsWith("http")
        )
        if (qq) escolhido = qq.thumbnail
      }
      out[cat] = escolhido
    }
    return out
  } catch {
    return {}
  }
}

export default async function CategoriesSection() {
  const [navCats, thumbs] = await Promise.all([
    getNavCategories(),
    getThumbnailsPorCategoria(),
  ])
  const byHandle = new Map(navCats.map((c) => [c.handle, c]))
  const cards = ORDEM.map((h) => {
    const cat = byHandle.get(h)
    if (!cat) return null
    return { handle: h, name: cat.name, count: cat.count, thumbnail: thumbs[h] || null }
  }).filter(Boolean) as { handle: string; name: string; count: number; thumbnail: string | null }[]

  if (!cards.length) return null
  return <CategoriesSectionClient cards={cards} />
}
