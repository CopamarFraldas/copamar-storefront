/**
 * Helpers de SEO/indexação — env-conscientes (#GEO).
 *
 * 🚨 SEGURO POR PADRÃO: a indexação só é liberada quando
 * NEXT_PUBLIC_ALLOW_INDEXING === "true" (setar SÓ em produção). Sem o flag
 * (staging/preview/dev), o site fica NOINDEX — robots.txt Disallow + meta
 * robots noindex — pra NUNCA vazar pro Google e brigar com o site vivo (Magento
 * em copamarfraldas.com.br) por duplicate content. Liga no cutover.
 */

/** true só quando explicitamente liberado (produção). Default = NÃO indexar. */
export const isIndexingAllowed = (): boolean =>
  process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true"

/** URL canônica do deploy atual (sem barra final). Staging usa a URL de staging. */
export const getSiteUrl = (): string =>
  (process.env.NEXT_PUBLIC_BASE_URL || "https://staging.copamarfraldas.com.br").replace(
    /\/+$/,
    ""
  )

/** Objeto `robots` pro Metadata do Next: noindex/nofollow fora de produção. */
export const robotsMeta = () =>
  isIndexingAllowed()
    ? { index: true, follow: true }
    : {
        index: false,
        follow: false,
        nocache: true,
        googleBot: { index: false, follow: false },
      }
