import * as Sentry from "@sentry/nextjs"

/** Sentry pro runtime EDGE (middleware) — mesma config do server (#67). */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment:
    process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true" ? "production" : "staging",
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
})
