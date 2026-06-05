import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-ui-bg-base relative small:min-h-screen">
      <div className="h-16 bg-ui-bg-base border-b ">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-ui-fg-base flex items-center gap-x-2 uppercase flex-1 basis-0"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base ">
              Voltar ao carrinho
            </span>
            <span className="mt-px block small:hidden txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base">
              Voltar
            </span>
          </LocalizedClientLink>
          {/* LOGO no centro (era só texto — Marco 04/06: consistência/confiança
              no checkout). Estático e leve, sem navegação extra. */}
          <LocalizedClientLink
            href="/"
            className="flex shrink-0 items-center"
            aria-label="Copamar Fraldas — voltar à loja"
            data-testid="store-link"
          >
            <Image
              src="/logo.png"
              alt="Copamar Fraldas"
              width={140}
              height={48}
              className="h-10 w-auto"
            />
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">{children}</div>
    </div>
  )
}
