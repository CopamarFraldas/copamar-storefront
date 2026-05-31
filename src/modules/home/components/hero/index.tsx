import Image from "next/image"
import ReviewsBadge from "@modules/common/components/reviews-badge"

const Hero = () => {
  return (
    <section className="relative bg-copamar-bg-light dark:bg-ui-bg-subtle border-b border-ui-border-base">
      <div className="content-container py-12 small:py-16">
        <div className="grid grid-cols-1 small:grid-cols-2 gap-8 items-center">
          <div className="text-center small:text-left">
            {/* posicionamento (C2): diferencial nº1 de busca, visível de cara */}
            <span className="inline-flex items-center gap-x-1.5 rounded-full bg-copamar-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-copamar-primary">
              🏭 Direto da fábrica · Preço de atacado
            </span>
            <h1 className="mt-3 text-3xl small:text-5xl font-bold text-copamar-primary dark:text-ui-fg-base leading-tight">
              Fraldas geriátricas
              <br />
              direto da fábrica
            </h1>
            <p className="mt-2 text-lg italic text-copamar-text dark:text-ui-fg-subtle">
              Cuidado e dignidade pra quem você ama.
            </p>
            <p className="text-base text-copamar-text dark:text-ui-fg-subtle mt-3 max-w-xl mx-auto small:mx-0">
              Atacadista e distribuidora especializada em fraldas geriátricas há
              20 anos, em Santo André/SP. Preço de fábrica e entrega para todo o
              Brasil — para cuidadores e profissionais de saúde.
            </p>
            {/* prova social real (C1) */}
            <div className="mt-4 flex justify-center small:justify-start">
              <ReviewsBadge />
            </div>
            <a
              href="#nossos-produtos"
              className="inline-block mt-6 px-6 py-3 bg-copamar-cta hover:bg-copamar-cta-dark text-white font-semibold rounded-large transition-colors"
              data-testid="hero-cta-explorar"
            >
              Explorar nossos produtos
            </a>
          </div>
          <div>
            <Image
              src="/hero-banner.png"
              alt="Copamar Fraldas — Qualidade de vida é o nosso negócio"
              width={820}
              height={462}
              priority
              // LCP do mobile: 1 coluna ocupa ~100vw; 2 colunas (small+) ~50vw,
              // teto 820px. Evita o Next servir a imagem cheia no celular.
              sizes="(max-width: 1024px) 100vw, 820px"
              className="rounded-large shadow-md w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
