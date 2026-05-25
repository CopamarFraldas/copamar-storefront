import { Heading } from "@medusajs/ui"

const Hero = () => {
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative bg-ui-bg-subtle">
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center small:p-32 gap-6">
        <span>
          <Heading
            level="h1"
            className="text-3xl leading-10 text-ui-fg-base font-normal"
          >
            Copamar Fraldas
          </Heading>
          <Heading
            level="h2"
            className="text-3xl leading-10 text-ui-fg-subtle font-normal"
          >
            Cuidado e dignidade pra quem você ama
          </Heading>
        </span>
        <p className="text-base-regular text-ui-fg-subtle max-w-2xl">
          Distribuidora especializada em fraldas geriátricas há 20 anos.
          Empresa familiar de Santo André, atendendo cuidadores e
          profissionais de saúde em todo o Brasil.
        </p>
      </div>
    </div>
  )
}

export default Hero
