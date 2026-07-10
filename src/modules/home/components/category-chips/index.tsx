import { getNavCategories } from "@lib/data/nav-categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CategoriaTrackLink from "@modules/common/components/categoria-track-link"
import ChipsScroller from "./chips-scroller"

/**
 * Régua de chips de categoria. Dois modos:
 *  - inline (header, híbrida E): só a régua de chips com scroll-x, pra ficar ao
 *    lado do botão "Categorias" na barra inferior do header (global).
 *  - bloco (legado): faixa própria com borda. (não usado mais na home)
 *
 * Server component. Lê as categorias reais; se a query falhar, some.
 */
const ATACADO_WHATS =
  "https://wa.me/5511952050000?text=" +
  encodeURIComponent(
    "Olá! Tenho CNPJ / preciso de compra grande (atacado). Pode me passar as condições?"
  )

const CategoryChips = async ({ inline = false }: { inline?: boolean }) => {
  const cats = await getNavCategories()
  if (!cats.length) return null

  const chips = [
    { handle: "__all__", name: "Ver tudo", href: "/store" },
    ...cats.map((c) => ({
      handle: c.handle,
      name: c.name,
      href: `/categories/${c.handle}`,
    })),
  ]

  const Lista = (
    <ul
      className={
        "flex snap-x gap-2 " +
        (inline
          ? "w-max py-0.5"
          : "content-container overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden small:flex-wrap small:overflow-visible")
      }
    >
      {/* chip de atacado/CNPJ — destacado, primeiro */}
      <li className="shrink-0 snap-start">
        <a
          href={ATACADO_WHATS}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-x-1 whitespace-nowrap rounded-full border border-copamar-primary bg-copamar-primary/10 px-4 py-1.5 text-sm font-semibold text-copamar-primary transition hover:bg-copamar-primary/20"
        >
          🏢 Atacado / CNPJ
        </a>
      </li>
      {chips.map((c) => {
        const cls =
          "inline-flex items-center whitespace-nowrap rounded-full border border-ui-border-base bg-ui-bg-base px-4 py-1.5 text-sm font-medium text-ui-fg-base transition hover:border-copamar-primary hover:bg-copamar-primary/10 hover:text-copamar-primary"
        return (
          <li key={c.handle} className="shrink-0 snap-start">
            {c.handle === "__all__" ? (
              <LocalizedClientLink href={c.href} className={cls}>
                {c.name}
              </LocalizedClientLink>
            ) : (
              // evento click_categoria (origem "chips") — fire-and-forget,
              // não bloqueia a navegação
              <CategoriaTrackLink
                handle={c.handle}
                origem="chips"
                href={c.href}
                className={cls}
              >
                {c.name}
              </CategoriaTrackLink>
            )}
          </li>
        )
      })}
    </ul>
  )

  if (inline) return <ChipsScroller>{Lista}</ChipsScroller>

  return (
    <nav aria-label="Categorias" className="border-b border-ui-border-base bg-ui-bg-base">
      {Lista}
    </nav>
  )
}

export default CategoryChips
