import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Breadcrumb VISÍVEL da PDP (#54 linking interno, 06/06): Início →
 * [categoria-pai →] categoria → produto. Antes só existia no JSON-LD (e
 * apontava pro genérico "Loja") — o cliente não tinha caminho de volta pra
 * categoria, e o Google recebia sinal fraco de hierarquia.
 */
const BreadcrumbPdp = ({ product }: { product: HttpTypes.StoreProduct }) => {
  // prioriza a categoria FOLHA (com pai) — mesma regra do JSON-LD da page
  const folha = (product.categories || [])
    .slice()
    .sort(
      (a: any, b: any) =>
        ((b as any).parent_category_id ? 1 : 0) - ((a as any).parent_category_id ? 1 : 0)
    )[0] as any

  const trilha: { nome: string; href: string }[] = [{ nome: "Início", href: "/" }]
  if (folha) {
    if (folha.parent_category?.handle) {
      trilha.push({
        nome: folha.parent_category.name,
        href: `/categories/${folha.parent_category.handle}`,
      })
    }
    trilha.push({ nome: folha.name, href: `/categories/${folha.handle}` })
  } else {
    trilha.push({ nome: "Loja", href: "/store" })
  }

  return (
    <nav aria-label="Navegação estrutural" className="content-container pt-4">
      <ol className="flex flex-wrap items-center gap-x-1 text-xs text-ui-fg-subtle">
        {trilha.map((t) => (
          <li key={t.href} className="flex items-center gap-x-1">
            <LocalizedClientLink
              href={t.href}
              className="hover:text-ui-fg-base hover:underline"
            >
              {t.nome}
            </LocalizedClientLink>
            <span aria-hidden>›</span>
          </li>
        ))}
        <li aria-current="page" className="truncate max-w-[60vw] text-ui-fg-base">
          {product.title}
        </li>
      </ol>
    </nav>
  )
}

export default BreadcrumbPdp
