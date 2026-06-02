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
          {/* linha 1 — responsivo:
              mobile:  [☰ logo] ........... [conta · tema · carrinho]  (logo à
                       esquerda, com respiro pras ações na direita)
              desktop: [☰ logo  BUSCA larga] ... [Blog · Quem somos · conta · tema
                       · carrinho]  (busca ao lado das Categorias, como pediu) */}
          <div className="flex items-center justify-between w-full h-16 gap-x-3">
            {/* esquerda: menu + logo + busca (desktop) */}
            <div className="flex items-center gap-x-3 small:gap-x-4 flex-1 min-w-0">
              <MegaMenu />
              <LocalizedClientLink
                href="/"
                className="flex items-center shrink-0"
                data-testid="nav-store-link"
              >
                <SpinLogo />
              </LocalizedClientLink>
              {/* busca larga, do lado das categorias (só desktop) */}
              <div className="hidden small:block flex-1 max-w-xl">
                <SearchBar />
              </div>
            </div>

            {/* direita: links (desktop) + conta + tema + carrinho */}
            <div className="flex items-center gap-x-4 small:gap-x-5 shrink-0">
              <div className="hidden small:flex items-center gap-x-5">
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
              {/* conta — clara em mobile E desktop */}
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
