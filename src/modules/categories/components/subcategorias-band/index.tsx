import { ordenaSubs } from "@lib/data/nav-categories"
import { rotuloSubcategorias } from "@lib/util/categorias"
import CategoriaTrackLink from "@modules/common/components/categoria-track-link"

type Sub = { id: string; name: string; handle: string }

/**
 * Faixa "Navegue por marca/tipo" no topo da página de categoria (aprovado
 * 10/07): botões grandes (≥44px de alto, touch-first, sem depender de hover)
 * pra cada subcategoria — nos dados de 30 dias as filhas quase não recebiam
 * visita via menu (Tena 4, Abena 2). Público 45-65: alvo de toque generoso,
 * rótulo explícito. Sem filhas → não renderiza nada.
 */
const SubcategoriasBand = ({
  categoriaNome,
  subs,
}: {
  categoriaNome: string
  subs?: Sub[] | null
}) => {
  if (!subs || subs.length === 0) return null

  const ordenadas = [...subs].sort(ordenaSubs)
  const { titulo } = rotuloSubcategorias(ordenadas.map((s) => s.name))

  return (
    <nav aria-label={`${titulo} em ${categoriaNome}`} className="mb-8">
      <h2 className="mb-3 text-base font-semibold text-ui-fg-base">{titulo}</h2>
      <div className="flex flex-wrap gap-3">
        {ordenadas.map((s) => (
          <CategoriaTrackLink
            key={s.id ?? s.handle}
            handle={s.handle}
            origem="faixa-categoria"
            href={`/categories/${s.handle}`}
            className="inline-flex min-h-[44px] items-center rounded-full border border-ui-border-base bg-ui-bg-subtle px-5 py-2 text-base font-medium text-ui-fg-base transition-colors hover:border-[#1251b8] hover:bg-[#1251b8]/5 hover:text-[#1251b8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1251b8] focus-visible:ring-offset-2"
          >
            {s.name}
          </CategoriaTrackLink>
        ))}
      </div>
    </nav>
  )
}

export default SubcategoriasBand
