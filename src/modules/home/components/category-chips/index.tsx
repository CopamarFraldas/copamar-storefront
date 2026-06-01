import { getNavCategories } from "@lib/data/nav-categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Régua de chips de categoria com scroll horizontal (item 2 do plano) — acesso
 * 1-toque às facetas mais usadas sem abrir o menu hambúrguer (que hoje é o único
 * caminho de categoria no mobile). Padrão ML/Drogasil: snap-x, sem quebra de
 * linha, o "corte" do último chip sinaliza que há mais à direita.
 *
 * Server component (zero JS). Lê as categorias reais; se a query falhar, some.
 */
const CategoryChips = async () => {
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

  return (
    <nav
      aria-label="Categorias"
      className="border-b border-ui-border-base bg-ui-bg-base"
    >
      <ul className="content-container flex snap-x gap-2 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((c) => (
          <li key={c.handle} className="shrink-0 snap-start">
            <LocalizedClientLink
              href={c.href}
              className="inline-flex items-center whitespace-nowrap rounded-full border border-ui-border-base bg-ui-bg-subtle px-4 py-1.5 text-sm font-medium text-ui-fg-base transition hover:border-copamar-primary hover:bg-copamar-primary/10 hover:text-copamar-primary"
            >
              {c.name}
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default CategoryChips
