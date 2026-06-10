import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProdutosEsteira from "@modules/home/components/produtos-esteira"
import BotaoWhatsApp from "@modules/home/components/botao-whatsapp"
import BannerEsteira from "@modules/home/components/banner-esteira"

/**
 * Hero de CONVERSÃO pra fralda geriátrica (Marco 09/06): vende conveniência +
 * tranquilidade, não "foto gigante de pacote". Esquerda = headline emocional +
 * subheadline + 2 CTAs (Comprar / WhatsApp) + prova social. Direita = cena
 * humana (idoso + cuidador) com pacotes reais. Abaixo = faixa de marcas.
 * A foto humana é PLACEHOLDER (entra foto real/licenciada depois).
 */
const MARCAS: { nome: string; logo: string | null }[] = [
  { nome: "TENA", logo: "/logos/tena.png" },
  { nome: "Abena", logo: "/logos/abena.png" },
  { nome: "Adultcare (Incofral)", logo: "/logos/adultcare.png" },
  { nome: "Biofral", logo: "/logos/biofral.png" },
  { nome: "DryMan (Dry Brasil)", logo: "/logos/dryman.png" },
  { nome: "Plena", logo: "/logos/plena.png" },
]

const PROVA = [
  { i: "⭐", t: "20 anos no mercado" },
  { i: "🚚", t: "Entrega rápida" },
  { i: "🔒", t: "Compra segura" },
  { i: "🏆", t: "Marcas líderes" },
]


export default function HeroConversao() {
  return (
    <>
      <div className="content-container py-10 small:py-14">
        <div className="grid grid-cols-1 items-center gap-10 small:grid-cols-2">
          {/* ESQUERDA — copy + CTAs + prova */}
          <div className="text-center small:text-left">
            <span className="inline-flex items-center gap-x-1.5 rounded-full bg-copamar-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-copamar-primary">
              🏭 Direto das fábricas · Atacado e varejo
            </span>
            <h1 className="mt-3 text-[2rem] font-bold leading-[1.1] text-copamar-primary small:text-5xl dark:text-ui-fg-base">
              Cuidado e dignidade
              <br /> pra quem você ama.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-copamar-text small:mx-0 small:text-lg dark:text-ui-fg-subtle">
              Fraldas geriátricas, absorventes e produtos para incontinência com
              entrega rápida e atendimento especializado.
            </p>
            <div className="mt-6 flex flex-col gap-3 small:flex-row small:justify-start justify-center sm:flex-row">
              <LocalizedClientLink
                href="/store"
                className="inline-flex items-center justify-center rounded-large bg-copamar-cta px-6 py-3 font-semibold text-white transition-colors hover:bg-copamar-cta-dark"
              >
                Comprar agora
              </LocalizedClientLink>
              <BotaoWhatsApp />
            </div>
            <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 small:justify-start">
              {PROVA.map((p) => (
                <li key={p.t} className="flex items-center gap-1.5 text-sm font-medium text-copamar-text dark:text-ui-fg-subtle">
                  <span aria-hidden>{p.i}</span> {p.t}
                </li>
              ))}
            </ul>
          </div>

          {/* DIREITA — cena humana (placeholder) + pacotes reais */}
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-large bg-[#f4ecdd] ring-1 ring-black/5">
              {/* foto real (Pexels, licença livre p/ uso comercial) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero/idoso-cuidado.jpg"
                alt="Pessoa idosa sorrindo, bem cuidada"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              {/* chip de prova social flutuando */}
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-copamar-primary shadow-md">
                ⭐ 4,9 no Google
              </span>
              {/* gradiente embaixo p/ legibilidade da esteira sobreposta */}
              <span className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/55 to-transparent" />
              {/* MUITOS produtos passando devagar SOBRE a parte baixa da foto (transparente) */}
              <div className="absolute inset-x-0 bottom-0 pb-2">
                <ProdutosEsteira altura={54} duracao={70} transparente />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAIXA DE MARCAS (logos) */}
      <div className="border-t border-ui-border-base bg-white dark:bg-ui-bg-base">
        <div className="content-container flex flex-wrap items-center justify-center gap-3 py-5">
          <span className="w-full text-center text-xs font-semibold uppercase tracking-wide text-ui-fg-muted small:w-auto">
            Marcas que trabalhamos:
          </span>
          {MARCAS.map((m) => (
            <div
              key={m.nome}
              title={m.nome}
              className="flex h-12 w-28 items-center justify-center rounded-large border border-ui-border-base bg-white px-3"
            >
              {m.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.logo} alt={m.nome} className="max-h-7 w-auto max-w-full object-contain" />
              ) : (
                <span className="text-base font-bold tracking-tight text-copamar-primary/80">
                  {m.nome}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Versão D fundida: banner rolante full-width abaixo das marcas (Marco 09/06) */}
      <BannerEsteira altura={200} duracao={90} />
    </>
  )
}
