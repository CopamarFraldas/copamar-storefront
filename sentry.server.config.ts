import * as Sentry from "@sentry/nextjs"

/**
 * Sentry SERVER-side (#67). environment separa staging de produção (staging
 * NÃO polui: filtra por env no painel; produção = NEXT_PUBLIC_ALLOW_INDEXING
 * ligado no cutover, mesma chave do noindex).
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment:
    process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true" ? "production" : "staging",
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
  // performance: amostra leve (erros sempre vão; traces são complemento)
  tracesSampleRate: 0.1,
  // sem PII automático (LGPD)
  sendDefaultPii: false,
})
