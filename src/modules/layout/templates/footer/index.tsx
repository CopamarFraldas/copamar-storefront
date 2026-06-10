import { Text } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ReviewsBadge from "@modules/common/components/reviews-badge"
import ConfigurarCookiesButton from "@modules/common/components/cookie-consent/configure-button"
import FooterCategories from "@modules/layout/components/footer-categories"
import { getNavCategories } from "@lib/data/nav-categories"

export default async function Footer() {
  const categories = await getNavCategories()

  return (
    <footer className="border-t border-ui-border-base w-full">
      <div className="content-container flex flex-col w-full">
        {/*
          DESKTOP (lg+): 5 colunas — identidade | 3 colunas de categorias (FooterCategories) | atendimento
          TABLET (md): 2 linhas — identidade+atendimento em cima, 3 colunas de categorias embaixo
          MOBILE (sm): tudo empilhado, categorias viram acordion
        */}
        <div className="py-16 lg:py-20">
          {/* desktop lg+: layout 5 colunas com identidade e atendimento nas pontas */}
          <div className="hidden lg:grid lg:grid-cols-[1.2fr_2.4fr_0.9fr] gap-x-12">
            <Identidade />
            <FooterCategories categories={categories} />
            <Atendimento />
          </div>

          {/* tablet md: identidade+atendimento em cima, categorias embaixo */}
          <div className="hidden md:block lg:hidden">
            <div className="flex flex-row gap-x-12 mb-10">
              <Identidade />
              <Atendimento />
            </div>
            <FooterCategories categories={categories} />
          </div>

          {/* mobile sm: empilhado com acordion */}
          <div className="md:hidden flex flex-col gap-y-8">
            <Identidade />
            <div>
              <h2 className="text-sm font-semibold text-ui-fg-base mb-2">Categorias</h2>
              <FooterCategories categories={categories} />
            </div>
            <Atendimento />
          </div>
        </div>

        <div className="flex flex-col w-full pb-10 gap-y-3 text-ui-fg-subtle">
          {/* identificação legal — Decreto 7.962/2013 (garimpo #12) */}
          <Text className="txt-compact-xsmall text-ui-fg-muted">
            Copamar Com. de Fraldas Descartáveis Ltda · CNPJ 08.140.992/0001-64 ·
            Rua Iugoslávia, 167 — Parque das Nações, Santo André/SP, CEP 09280-110 ·{" "}
            <a
              href="tel:+551141190201"
              className="hover:text-[#1251b8] transition-colors"
            >
              (11) 4119-0201
            </a>
          </Text>
          <div className="flex flex-col xsmall:flex-row w-full gap-y-2 justify-between">
            <Text className="txt-compact-small">
              © {new Date().getFullYear()} Copamar Fraldas. Todos os direitos reservados.
            </Text>
            <ConfigurarCookiesButton />
          </div>
        </div>
      </div>
    </footer>
  )
}

const Identidade = () => (
  <div className="flex flex-col gap-y-3 max-w-xs">
    <LocalizedClientLink
      href="/"
      className="txt-compact-xlarge-plus text-ui-fg-base hover:text-[#1251b8] uppercase font-semibold"
    >
      Copamar Fraldas
    </LocalizedClientLink>
    <p className="txt-small text-ui-fg-subtle leading-relaxed">
      Especialista em fraldas geriátricas desde 2006. Empresa familiar de
      Santo André/SP. CNPJ 08.140.992/0001-64.
    </p>
    {/* selo de confiança (#42) — avaliações reais da loja no Google */}
    <ReviewsBadge />
    <LocalizedClientLink
      href="/sobre"
      className="txt-small text-[#1251b8] hover:underline"
    >
      Conheça nossa história →
    </LocalizedClientLink>
  </div>
)

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
  </svg>
)

const Atendimento = () => (
  <div className="flex flex-col gap-y-3">
    <h3 className="text-sm font-semibold text-ui-fg-base">Atendimento</h3>
    {/* Botão MAPA — destaque visual (assistente virtual 24h, mais usado) */}
    <a
      href="https://wa.me/551149903013"
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full bg-[#25d366] hover:bg-[#1ebe5d] text-white font-semibold px-4 py-2.5 shadow-md hover:shadow-lg transition-all"
      aria-label="Falar com a Mapa, assistente virtual da Copamar, pelo WhatsApp"
    >
      <WhatsAppIcon />
      <span className="flex flex-col leading-tight">
        <span className="text-sm">Falar com a Mapa</span>
        <span className="text-[10px] font-normal opacity-90">Assistente virtual · 24h</span>
      </span>
    </a>
    {/* Botão Atendente — secundário, contorno */}
    <a
      href="https://wa.me/5511952050000"
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-[#25d366] text-[#25d366] hover:bg-[#25d366]/10 font-semibold px-4 py-2.5 transition-colors"
      aria-label="Falar com um atendente humano pelo WhatsApp"
    >
      <WhatsAppIcon />
      <span className="flex flex-col leading-tight">
        <span className="text-sm">Falar com atendente</span>
        <span className="text-[10px] font-normal opacity-80">Seg a Sex · 8h às 17h</span>
      </span>
    </a>
    <a
      href="mailto:vendas@copamarfraldas.com.br"
      className="text-xs text-ui-fg-subtle hover:text-[#1251b8] transition-colors mt-1"
    >
      ou e-mail: vendas@copamarfraldas.com.br
    </a>
    {/* páginas institucionais de atendimento (Marco 04/06) */}
    <div className="mt-1 flex flex-col gap-y-1">
      <LocalizedClientLink
        href="/contato"
        className="text-xs text-ui-fg-subtle hover:text-[#1251b8] transition-colors"
      >
        Contato e endereço
      </LocalizedClientLink>
      <LocalizedClientLink
        href="/trocas-e-devolucoes"
        className="text-xs text-ui-fg-subtle hover:text-[#1251b8] transition-colors"
      >
        Trocas e Devoluções
      </LocalizedClientLink>
      <LocalizedClientLink
        href="/perguntas-frequentes"
        className="text-xs text-ui-fg-subtle hover:text-[#1251b8] transition-colors"
      >
        Perguntas frequentes
      </LocalizedClientLink>
      <LocalizedClientLink
        href="/politica-de-privacidade"
        className="text-xs text-ui-fg-subtle hover:text-[#1251b8] transition-colors"
      >
        Política de Privacidade
      </LocalizedClientLink>
    </div>
  </div>
)
