import Image from "next/image"

const Hero = () => {
  return (
    <section className="relative bg-copamar-bg-light dark:bg-ui-bg-subtle border-b border-ui-border-base">
      <div className="content-container py-12 small:py-16">
        <div className="grid grid-cols-1 small:grid-cols-2 gap-8 items-center">
          <div className="text-center small:text-left">
            <h1 className="text-3xl small:text-5xl font-bold text-copamar-primary dark:text-ui-fg-base leading-tight">
              Cuidado e dignidade
              <br />
              pra quem você ama
            </h1>
            <p className="text-lg text-copamar-text dark:text-ui-fg-subtle mt-4 max-w-xl mx-auto small:mx-0">
              Distribuidora especializada em fraldas geriátricas há 20 anos.
              Empresa familiar de Santo André, atendendo cuidadores e
              profissionais de saúde em todo o Brasil.
            </p>
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
              className="rounded-large shadow-md w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
