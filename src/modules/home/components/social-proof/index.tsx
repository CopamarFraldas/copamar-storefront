import ReviewsBadge from "@modules/common/components/reviews-badge"

/**
 * Prova social (item 6 da proposta) — "por que confiam na Copamar". SÓ o REAL:
 * avaliação do Google Negócios, tempo de casa, público B2B. Nada de depoimento
 * inventado (mesmo princípio do AggregateRating: nada fabricado).
 */
const SocialProof = () => (
  <section
    aria-label="Por que confiam na Copamar"
    className="border-y border-ui-border-base bg-copamar-bg-light dark:bg-ui-bg-subtle"
  >
    <div className="content-container py-12 small:py-16">
      <h2 className="mb-8 text-center text-2xl font-bold text-copamar-primary dark:text-ui-fg-base small:text-3xl">
        Por que confiam na Copamar
      </h2>
      <div className="grid grid-cols-1 gap-8 text-center small:grid-cols-3">
        <div className="flex flex-col items-center gap-y-2">
          <ReviewsBadge />
          <p className="text-sm text-ui-fg-subtle">
            Avaliação real no Google Negócios
          </p>
        </div>
        <div className="flex flex-col items-center gap-y-1">
          <span className="text-3xl font-bold text-copamar-primary dark:text-ui-fg-base">
            20 anos
          </span>
          <p className="text-sm text-ui-fg-subtle">
            Desde 2006, a sua escolha especialista em fraldas geriátricas.
          </p>
        </div>
        <div className="flex flex-col items-center gap-y-1">
          <span className="text-3xl font-bold text-copamar-primary dark:text-ui-fg-base">
            Atacado &amp; varejo
          </span>
          <p className="text-sm text-ui-fg-subtle">
            atende famílias, cuidadores e profissionais de saúde
          </p>
        </div>
      </div>
    </div>
  </section>
)

export default SocialProof
