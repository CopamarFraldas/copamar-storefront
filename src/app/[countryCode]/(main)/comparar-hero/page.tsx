import Image from "next/image"
import type { Metadata } from "next"
import BannerEsteira from "@modules/home/components/banner-esteira"
import HeroConversao from "@modules/home/components/hero-conversao"

// Página TEMPORÁRIA de comparação do lado direito do hero (Marco 09/06).
// NOINDEX — só pra decidir entre: A) foto única forte · B) faixa de marcas
// (multimarca) · C) grid curado de 6 produtos reais. Some depois da decisão.
export const metadata: Metadata = { robots: { index: false, follow: false } }

const GRID6 = [
  { t: "Tena Slip Dermacare", img: "https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7896770983383-0-01KSMWWC4RK4YGN982KH3W607Z.webp" },
  { t: "Tena Men", img: "https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7322540016413-6-0-01KSMWWHYGGPFX68PF1Y7ZA2JR.webp" },
  { t: "Abena Abri-Soft", img: "https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/5713571004821-0-01KSMY5CRTGF67TGY7KM3M4CJV.jpg" },
  { t: "Adultcare", img: "https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7896104605806-0-01KSMWW8FZ81WGBGWEY9YW6B2Y.webp" },
  { t: "Tena Pants Confort", img: "https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7896770979331-0-01KSMWWV73X4REZC6VZPC6JX42.webp" },
  { t: "Enzzo Baby", img: "https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/enzzo-7898773230464-pai-0.jpg" },
]
const MARCAS = ["Tena", "Abena", "Adultcare", "Dryman", "Bigfral", "Enzzo"]
const FOTO_FORTE = GRID6[0].img // Tena Slip Dermacare, foto oficial limpa

/** Coluna esquerda real do hero (copiada pra comparar em contexto). */
function HeroEsquerda() {
  return (
    <div className="text-center small:text-left">
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
      <p className="hidden small:block text-base text-copamar-text dark:text-ui-fg-subtle mt-3 max-w-xl">
        Atacadista e distribuidora especializada em fraldas geriátricas há 20
        anos, em Santo André/SP. Preço de atacado e entrega para todo o Brasil.
      </p>
      <span className="inline-block mt-5 px-6 py-3 bg-copamar-cta text-white font-semibold rounded-large">
        Ver produtos
      </span>
    </div>
  )
}

/** A — UMA foto forte de produto. */
function VarianteA() {
  return (
    <div className="relative flex items-center justify-center rounded-large bg-gradient-to-br from-copamar-primary/5 to-copamar-cta/10 p-6 aspect-[820/462] overflow-hidden">
      <div className="relative h-full w-[62%]">
        <Image src={FOTO_FORTE} alt="Tena Slip Dermacare" fill sizes="500px" className="object-contain drop-shadow-2xl" />
      </div>
      <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-copamar-primary shadow">
        Linha premium · pronta-entrega
      </span>
    </div>
  )
}

/** B — Faixa de MARCAS (multimarca). Tiles = placeholder dos logos reais. */
function VarianteB() {
  return (
    <div className="flex flex-col justify-center rounded-large bg-copamar-bg-light dark:bg-ui-bg-base border border-ui-border-base p-6 aspect-[820/462]">
      <p className="text-center text-lg font-semibold text-copamar-primary dark:text-ui-fg-base">
        As marcas que você confia, num lugar só
      </p>
      <p className="mb-4 text-center text-sm text-copamar-text dark:text-ui-fg-subtle">
        Distribuidora multimarca — direto das fábricas
      </p>
      <div className="grid grid-cols-3 gap-3">
        {MARCAS.map((m) => (
          <div
            key={m}
            className="flex items-center justify-center rounded-large border border-ui-border-base bg-white px-2 py-5 text-base font-bold tracking-tight text-copamar-primary shadow-sm"
          >
            {m}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] italic text-ui-fg-muted">
        (mock — aqui entram os logos oficiais de cada marca)
      </p>
    </div>
  )
}

/** C — Grid curado de 6 produtos reais. */
function VarianteC() {
  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-2.5 rounded-large bg-copamar-bg-light dark:bg-ui-bg-base p-2.5 aspect-[820/462]">
      {GRID6.map((p) => (
        <div key={p.t} className="relative overflow-hidden rounded-rounded bg-white shadow-sm">
          <Image src={p.img} alt={p.t} fill sizes="240px" className="object-contain p-2" />
          <span className="absolute bottom-1 left-1 right-1 truncate rounded bg-white/85 px-1.5 py-0.5 text-[10px] font-medium text-copamar-text">
            {p.t}
          </span>
        </div>
      ))}
    </div>
  )
}

const VERSOES: { id: string; nome: string; nota: string; comp: React.ReactNode }[] = [
  { id: "atual", nome: "ATUAL (referência)", nota: "logo + slogan — o que está no ar hoje", comp: (
      <Image src="/hero-banner.png" alt="banner atual" width={820} height={462} className="rounded-large shadow-md w-full h-auto" />
  ) },
  { id: "A", nome: "Versão A — Foto única forte", nota: "1 produto bem apresentado · premium · leve (bom LCP)", comp: <VarianteA /> },
  { id: "B", nome: "Versão B — Faixa de marcas", nota: "grita 'multimarca/distribuidora' · selo de confiança clássico", comp: <VarianteB /> },
  { id: "C", nome: "Versão C — Grid curado de 6", nota: "mostra a variedade real · concreto · sem virar 'gaveta'", comp: <VarianteC /> },
]

export default function CompararHero() {
  return (
    <div className="py-8">
      <div className="content-container mb-6">
        <h2 className="text-2xl font-bold text-copamar-primary">Comparar lado direito do hero</h2>
        <p className="text-ui-fg-subtle">A coluna da esquerda é a real. Compare só o lado direito. Página temporária (NOINDEX).</p>
      </div>
      {VERSOES.map((v, i) => (
        <section
          key={v.id}
          className={`border-y border-ui-border-base ${i % 2 ? "bg-ui-bg-subtle" : "bg-copamar-bg-light dark:bg-ui-bg-subtle"}`}
        >
          <div className="content-container py-10">
            <div className="mb-4">
              <span className="rounded-full bg-copamar-primary px-3 py-1 text-sm font-bold text-white">{v.nome}</span>
              <span className="ml-3 text-sm text-ui-fg-subtle">{v.nota}</span>
            </div>
            <div className="grid grid-cols-1 small:grid-cols-2 gap-8 items-center">
              <HeroEsquerda />
              <div>{v.comp}</div>
            </div>
          </div>
        </section>
      ))}

      {/* Versão D — esteira full-width com cards da marca intercalados
          (precisa ver DESLIZANDO ao vivo). Sem texto solto em cima: o recado
          da Copamar anda DENTRO da esteira, a cada 3 banners. */}
      <section className="border-y border-ui-border-base bg-copamar-bg-light dark:bg-ui-bg-subtle">
        <div className="content-container py-6">
          <span className="rounded-full bg-copamar-cta px-3 py-1 text-sm font-bold text-white">
            Versão D — Esteira de banners + cards da marca
          </span>
          <span className="ml-3 text-sm text-ui-fg-subtle">
            banners do site emendados num tapete único, com o recado da Copamar a cada 3 banners — desliza de ponta a ponta (passe o mouse pra pausar)
          </span>
        </div>
        {/* a esteira ocupa a largura TOTAL da tela */}
        <BannerEsteira altura={240} duracao={90} />
      </section>

      {/* Versão E — hero de conversão (humano + prova + faixa de logos) */}
      <section className="border-y border-ui-border-base bg-copamar-bg-light dark:bg-ui-bg-subtle">
        <div className="content-container pt-8">
          <span className="rounded-full bg-emerald-600 px-3 py-1 text-sm font-bold text-white">
            Versão E — Hero de conversão
          </span>
          <span className="ml-3 text-sm text-ui-fg-subtle">
            vende conveniência + tranquilidade: headline emocional, 2 CTAs (Comprar / WhatsApp), prova social e cena humana + faixa de marcas
          </span>
        </div>
        <HeroConversao />
      </section>
    </div>
  )
}
