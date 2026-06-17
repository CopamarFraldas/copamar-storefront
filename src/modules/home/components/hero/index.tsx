import Image from "next/image"
import ReviewsBadge from "@modules/common/components/reviews-badge"

const Hero = () => {
  return (
    <section className="relative bg-copamar-bg-light dark:bg-ui-bg-subtle border-b border-ui-border-base">
      <div className="content-container py-6 small:py-16">
        <div className="grid grid-cols-1 small:grid-cols-2 gap-5 small:gap-8 items-center">
          {/* no mobile a imagem vem PRIMEIRO (order-1) pra dar visual logo de
              cara; o texto fica enxuto embaixo. no desktop, texto à esquerda. */}
          <div className="order-2 small:order-1 text-center small:text-left">
            {/* posicionamento honesto (escolha do Marco): compram direto das
                fábricas das marcas e repassam preço de atacado — sem afirmar ser
                fabricante (a empresa é distribuidora/atacadista). */}
            <span className="inline-flex items-center gap-x-1.5 rounded-full bg-copamar-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-copamar-primary">
              🏭 Direto das fábricas · Atacado e varejo
            </span>
            <h1 className="mt-3 text-[1.7rem] leading-tight small:text-5xl font-bold text-copamar-primary dark:text-ui-fg-base">
              Fraldas geriátricas
              <br />
              direto das fábricas
            </h1>
            <p className="mt-2 text-base small:text-lg italic text-copamar-text dark:text-ui-fg-subtle">
              Cuidado e dignidade pra quem você ama.
            </p>
            {/* parágrafo institucional só no desktop — no mobile enxuga a dobra */}
            <p className="hidden small:block text-base text-copamar-text dark:text-ui-fg-subtle mt-3 max-w-xl">
              Atacadista e distribuidora especializada em fraldas geriátricas há
              20 anos, em Santo André/SP. Preço de atacado e entrega para todo o
              Brasil — para cuidadores e profissionais de saúde.
            </p>
            {/* prova social real (C1) */}
            <div className="mt-3 small:mt-4 flex justify-center small:justify-start">
              <ReviewsBadge />
            </div>
            <a
              href="#nossos-produtos"
              className="inline-block mt-4 small:mt-6 px-6 py-3 bg-copamar-cta hover:bg-copamar-cta-dark text-[#0a2e6b] font-semibold rounded-large transition-colors"
              data-testid="hero-cta-explorar"
            >
              Ver produtos
            </a>
          </div>
          <div className="order-1 small:order-2">
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
