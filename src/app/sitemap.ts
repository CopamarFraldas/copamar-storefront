import { MetadataRoute } from "next"
import { getAllPosts } from "@lib/data/blog"
import { listProducts } from "@lib/data/products"

const SITE_URL = "https://copamarfraldas.com.br"

// revalida de hora em hora (produtos/artigos podem mudar)
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const estaticas: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/sobre`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/store`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ]

  // artigos publicados (drafts ficam de fora até aprovação)
  const artigos: MetadataRoute.Sitemap = getAllPosts().map((p) => ({
    url: `${SITE_URL}/blog/${p.frontmatter.slug}`,
    lastModified: new Date(p.frontmatter.updatedAt || p.frontmatter.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  // produtos individuais — degrada gracioso se o backend não responder
  let produtos: MetadataRoute.Sitemap = []
  try {
    const { response } = await listProducts({
      countryCode: "br",
      queryParams: { limit: 100, fields: "handle,updated_at" },
    })
    produtos = response.products
      .filter((p) => p.handle)
      .map((p) => ({
        url: `${SITE_URL}/products/${p.handle}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }))
  } catch {
    // sem produtos no sitemap se o fetch falhar; páginas principais permanecem
  }

  return [...estaticas, ...artigos, ...produtos]
}
