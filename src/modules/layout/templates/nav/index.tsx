import { Suspense } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SpinLogo from "@modules/layout/components/spin-logo"
import ThemeToggle from "@modules/layout/components/theme-toggle"
import MegaMenu from "@modules/layout/components/mega-menu"
import NoticeBar from "@modules/layout/components/notice-bar"
import SearchBar from "@modules/layout/components/search-bar"
import AccountButton from "@modules/layout/components/account-button"
import CategoryChips from "@modules/home/components/category-chips"
import { retrieveCustomer } from "@lib/data/customer"

/**
 * Header — layout "híbrido E" (escolhido pelo Marco):
 *   linha 1: [☰/links] · LOGO central · [conta · tema · carrinho]
 *   linha 2: BUSCA full-width (espelho do mobile — o caminho nº1)
 *   linha 3: barra de categorias global ([Categorias] no desktop + chips)
 * No mobile o menu é o hambúrguer (linha 1) e a barra mostra só os chips.
 */
export default async function Nav() {
  const customer = await retrieveCustomer().catch(() => null)
  return (
    <>
      {/* barra de aviso no topo (rola pra fora; o header abaixo é sticky) */}
      <NoticeBar />
      <div className="sticky top-0 inset-x-0 z-50 group">
        <header className="relative mx-auto border-b border-ui-border-base bg-ui-bg-base duration-200">
          <nav className="content-container flex flex-col text-small-regular text-ui-fg-base">
            {/* ── linha 1 — logo RESPONSIVO: central no desktop, à esquerda no
                mobile (no celular o logo central espremia as ações). ── */}
            <div className="flex h-16 w-full items-center justify-between gap-x-3">
              {/* esquerda: hambúrguer(mobile)+logo(mobile)  /  links(desktop) */}
              <div className="flex flex-1 min-w-0 items-center gap-x-3 small:gap-x-5">
                <div className="small:hidden">
                  <MegaMenu />
                </div>
                {/* logo à esquerda no MOBILE — maior que o desktop (52px vs 44px)
                    e com respiro do grupo da direita (Marco, ajuste 04/06) */}
                <LocalizedClientLink
                  href="/"
                  aria-label="Início — Copamar Fraldas"
                  className="flex shrink-0 items-center small:hidden"
                  data-testid="nav-store-link"
                >
                  <SpinLogo className="h-[52px]" />
                </LocalizedClientLink>
                {/* links institucionais no DESKTOP */}
                <div className="hidden small:flex items-center gap-x-5 text-ui-fg-subtle">
                  <LocalizedClientLink className="hover:text-ui-fg-base" href="/blog" data-testid="nav-blog-link">
                    Blog
                  </LocalizedClientLink>
                  <LocalizedClientLink className="hover:text-ui-fg-base" href="/sobre" data-testid="nav-sobre-link">
                    Quem somos
                  </LocalizedClientLink>
                </div>
              </div>

              {/* logo CENTRAL no DESKTOP */}
              <LocalizedClientLink
                href="/"
                aria-label="Início — Copamar Fraldas"
                className="hidden shrink-0 cursor-pointer items-center small:flex"
              >
                <SpinLogo />
              </LocalizedClientLink>

              {/* direita: conta · carrinho no MOBILE (tema foi pro hambúrguer);
                  conta · tema · carrinho no desktop. ml-4 garante o respiro
                  entre o logo e este grupo no mobile. */}
              <div className="ml-4 flex shrink-0 items-center gap-x-5 small:ml-0 small:flex-1 small:min-w-0 small:justify-end">
                <AccountButton nome={customer?.first_name} />
                <span className="hidden small:flex">
                  <ThemeToggle />
                </span>
                <Suspense
                  fallback={
                    <LocalizedClientLink
                      className="flex items-center gap-x-1.5 text-ui-fg-subtle hover:text-ui-fg-base"
                      href="/cart"
                      data-testid="nav-cart-link"
                      aria-label="Carrinho"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <path d="M3 6h18" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      <span className="hidden small:inline">Carrinho</span>
                    </LocalizedClientLink>
                  }
                >
                  <CartButton />
                </Suspense>
              </div>
            </div>

            {/* ── linha 2: busca full-width (o caminho nº1) ── */}
            <div className="w-full pb-3">
              <SearchBar />
            </div>
          </nav>

          {/* ── linha 3: barra de categorias (global) ── */}
          <div className="border-t border-ui-border-base bg-ui-bg-subtle/50">
            <div className="content-container flex items-center gap-x-3 py-2">
              {/* desktop: "Categorias" (mega-menu) como porta explícita */}
              <div className="hidden small:block shrink-0">
                <MegaMenu />
              </div>
              <CategoryChips inline />
            </div>
          </div>
        </header>
      </div>
    </>
  )
}
