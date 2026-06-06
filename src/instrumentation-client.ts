import * as Sentry from "@sentry/nextjs"

/**
 * Sentry CLIENT-side (#67). Session Replay DESLIGADO de propósito (LGPD —
 * só erros, sem gravação de sessão/PII). environment staging|production
 * (staging não polui; filtra por env no painel).
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment:
    process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true" ? "production" : "staging",
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  // sem Replay: respeito ao consent LGPD — só captura de ERROS
  integrations: [],
})

// navegação SPA instrumentada (exigido pelo SDK pra traces de router)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
