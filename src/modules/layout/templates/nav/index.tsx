import { Suspense } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SpinLogo from "@modules/layout/components/spin-logo"
import ThemeToggle from "@modules/layout/components/theme-toggle"
import MegaMenu from "@modules/layout/components/mega-menu"
import NoticeBar from "@modules/layout/components/notice-bar"
import SearchBar from "@modules/layout/components/search-bar"
import AccountButton from "@modules/layout/components/account-button"
import { retrieveCustomer } from "@lib/data/customer"

export default async function Nav() {
  const customer = await retrieveCustomer().catch(() => null)
  return (
    <>
      {/* barra de aviso no topo (rola pra fora; o header abaixo é sticky) */}
      <NoticeBar />
      <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative mx-auto border-b duration-200 bg-ui-bg-base border-ui-border-base">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex flex-col text-small-regular">
          {/* linha 1: menu · logo · (busca desktop) · ações */}
          <div className="flex items-center justify-between w-full h-16">
            <div className="flex-1 basis-0 h-full flex items-center gap-x-4">
              <MegaMenu />
            </div>

            <div className="flex items-center h-full">
              <LocalizedClientLink
                href="/"
                className="flex items-center"
                data-testid="nav-store-link"
              >
                <SpinLogo />
              </LocalizedClientLink>
            </div>

            <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
              {/* busca inline no desktop (no mobile vai pra 2ª linha) */}
              <div className="hidden small:block w-full max-w-xs">
                <SearchBar />
              </div>
              <div className="hidden small:flex items-center gap-x-6 h-full">
                <LocalizedClientLink
                  className="hover:text-ui-fg-base"
                  href="/blog"
                  data-testid="nav-blog-link"
                >
                  Blog
                </LocalizedClientLink>
                <LocalizedClientLink
                  className="hover:text-ui-fg-base"
                  href="/sobre"
                  data-testid="nav-sobre-link"
                >
                  Quem somos
                </LocalizedClientLink>
              </div>
              {/* conta — clara em mobile E desktop (visitante: Entrar; logado:
                  dropdown com Minha conta · Meus pedidos · Comprar de novo) */}
              <AccountButton nome={customer?.first_name} />
              <ThemeToggle />
              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base flex gap-2"
                    href="/cart"
                    data-testid="nav-cart-link"
                  >
                    Carrinho (0)
                  </LocalizedClientLink>
                }
              >
                <CartButton />
              </Suspense>
            </div>
          </div>

          {/* linha 2: busca full-width só no mobile (a porta de entrada do
              cuidador que já sabe a marca/modelo) */}
          <div className="small:hidden w-full pb-3">
            <SearchBar />
          </div>
        </nav>
      </header>
      </div>
    </>
  )
}
