import { Text } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
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

        <div className="flex flex-col xsmall:flex-row w-full pb-10 gap-y-2 justify-between text-ui-fg-muted">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} Copamar Fraldas. Todos os direitos reservados.
          </Text>
          <ConfigurarCookiesButton />
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
    <p className="txt-small text-ui-fg-muted leading-relaxed">
      Especialista em fraldas geriátricas desde 2006. Empresa familiar de
      Santo André/SP. CNPJ 08.140.992/0001-64.
    </p>
    <LocalizedClientLink
      href="/sobre"
      className="txt-small text-[#1251b8] hover:underline"
    >
      Conheça nossa história →
    </LocalizedClientLink>
  </div>
)

const Atendimento = () => (
  <div className="flex flex-col gap-y-2">
    <h3 className="text-sm font-semibold text-ui-fg-base">Atendimento</h3>
    <ul className="flex flex-col gap-y-2 text-sm text-ui-fg-subtle">
      <li>
        <a
          href="https://wa.me/5511952050000"
          target="_blank"
          rel="noreferrer"
          className="hover:text-[#1251b8] transition-colors"
        >
          WhatsApp
        </a>
      </li>
      <li>
        <a
          href="mailto:vendas@copamarfraldas.com.br"
          className="hover:text-[#1251b8] transition-colors"
        >
          E-mail
        </a>
      </li>
      <li>
        <span className="text-ui-fg-muted">Seg a Sex: 8h às 17h</span>
      </li>
    </ul>
  </div>
)
