import * as Sentry from "@sentry/nextjs"

/**
 * Instrumentation do Next (#67): carrega o Sentry no runtime certo e captura
 * erros de RSC/route handlers via onRequestError (Next 15).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config")
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config")
  }
}

export const onRequestError = Sentry.captureRequestError
