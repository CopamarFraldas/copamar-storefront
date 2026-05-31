import { MetadataRoute } from "next"
import { getSiteUrl, isIndexingAllowed } from "@lib/util/seo"

/**
 * robots.txt env-consciente.
 * 🚨 STAGING/PREVIEW: Disallow total (não vaza pro Google — guardrail nº1).
 * PRODUÇÃO (NEXT_PUBLIC_ALLOW_INDEXING="true"): libera buscadores + crawlers de
 * IA/LLM (GEO) e aponta o sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  const SITE_URL = getSiteUrl()

  if (!isIndexingAllowed()) {
    // ambiente não-produção: bloqueia TUDO, sem sitemap.
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    }
  }

  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
