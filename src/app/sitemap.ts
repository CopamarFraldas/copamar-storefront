import { MetadataRoute } from "next"
import { getAllPosts } from "@lib/data/blog"
import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import { getSiteUrl } from "@lib/util/seo"

// URL env-consciente (staging usa o host de staging; produção, o canônico).
const SITE_URL = getSiteUrl()

// Auditoria #54 (05/06): TODAS as URLs com o prefixo de país — os canonicals
// das páginas são /{cc}/...; sitemap sem o prefixo mandava o Google pra URLs
// que dão 307 e divergem do canonical (sinal misto). BASE casa com o canonical.
const CC = process.env.NEXT_PUBLIC_DEFAULT_REGION || "br"
const BASE = `${SITE_URL}/${CC}`

// revalida de hora em hora (produtos/artigos podem mudar)
export const revalidate = 3600

// <image:loc> EXIGE URL ABSOLUTA — o Search Console rejeita relativa (4 inválidas
// 18/06: thumbnails locais da mídia oficial /produtos/*.webp Tena/DryMan vinham
// sem domínio). Prefixa SITE_URL quando não for http(s). A imagem mora em /public,
// na RAIZ (não sob /br) → usa SITE_URL, não BASE.
const imgAbs = (u: string): string =>
  /^https?:\/\//i.test(u) ? u : `${SITE_URL}${u.startsWith("/") ? "" : "/"}${u}`

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const estaticas: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${BASE}/sobre`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/contato`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE}/store`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    // /trocas-e-devolucoes e /perguntas-frequentes entram aqui quando saírem
    // do RASCUNHO (hoje são noindex de propósito — não listar no sitemap).
  ]

  // artigos publicados (drafts ficam de fora até aprovação)
  const artigos: MetadataRoute.Sitemap = getAllPosts().map((p) => ({
    url: `${BASE}/blog/${p.frontmatter.slug}`,
    lastModified: new Date(p.frontmatter.updatedAt || p.frontmatter.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  // categorias — landing pages das keywords (#56); degrada gracioso
  let categorias: MetadataRoute.Sitemap = []
  try {
    const cats = await listCategories()
    categorias = (cats || [])
      .filter((c: any) => c.handle)
      .map((c: any) => ({
        url: `${BASE}/categories/${c.handle}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
  } catch {
    // segue sem categorias se o fetch falhar
  }

  // produtos individuais — degrada gracioso se o backend não responder.
  // limit 1000 (06/06): o cap de 100 derrubaria produtos novos do sitemap em
  // silêncio quando o catálogo passar de 100 (hoje ~99). + images (lastmod
  // real já vinha do updated_at).
  let produtos: MetadataRoute.Sitemap = []
  try {
    const { response } = await listProducts({
      countryCode: CC,
      queryParams: { limit: 1000, fields: "handle,updated_at,thumbnail" },
    })
    produtos = response.products
      .filter((p) => p.handle)
      .map((p) => ({
        url: `${BASE}/products/${p.handle}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
        // imagem do produto no sitemap (Google Imagens / rich results) — ABSOLUTA
        ...(p.thumbnail ? { images: [imgAbs(p.thumbnail)] } : {}),
      }))
  } catch {
    // sem produtos no sitemap se o fetch falhar; páginas principais permanecem
  }

  return [...estaticas, ...artigos, ...categorias, ...produtos]
}
