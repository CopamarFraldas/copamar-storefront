"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { NavCat } from "@lib/data/nav-categories"

type Props = { categories: NavCat[] }

// distribuição definida pelo Marco — equilibra as 3 colunas (~9/10/10 linhas)
const COLUNAS: { titulo: string; handles: string[] }[] = [
  { titulo: "Fraldas & Infantil",       handles: ["fraldas-geriatricas", "fralda-infantil"] },
  { titulo: "Pants & Cama",             handles: ["roupa-intima", "absorvente-geriatrico", "protetores-de-cama"] },
  { titulo: "Higiene & Absorventes",    handles: ["higiene", "absorvente-feminino", "absorvente-masculino"] },
]

/** Bloco de uma categoria (pai + subs + ver tudo). Reusado no desktop e no acordion. */
const BlocoCategoria = ({ cat, onLink }: { cat: NavCat; onLink?: () => void }) => (
  <div>
    <h3 className="text-sm font-semibold text-ui-fg-base">
      <LocalizedClientLink
        href={`/categories/${cat.handle}`}
        onClick={onLink}
        className="hover:text-[#1251b8] transition-colors"
      >
        {cat.name}{" "}
        <span className="font-normal text-ui-fg-subtle">({cat.count})</span>
      </LocalizedClientLink>
    </h3>
    {cat.subs.length > 0 ? (
      <>
        <ul className="mt-2 flex flex-col gap-1.5 pl-3">
          {cat.subs.map((s) => (
            <li key={s.handle}>
              <LocalizedClientLink
                href={`/categories/${s.handle}`}
                onClick={onLink}
                className="text-sm text-ui-fg-subtle hover:text-[#1251b8] transition-colors"
              >
                {s.name}{" "}
                <span className="text-ui-fg-subtle">({s.count})</span>
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
        <LocalizedClientLink
          href={`/categories/${cat.handle}`}
          onClick={onLink}
          className="mt-2 inline-block pl-3 text-xs font-medium text-[#1251b8] hover:underline"
        >
          Ver tudo →
        </LocalizedClientLink>
      </>
    ) : (
      <LocalizedClientLink
        href={`/categories/${cat.handle}`}
        onClick={onLink}
        className="mt-1 inline-block pl-3 text-xs font-medium text-[#1251b8] hover:underline"
      >
        Ver produtos →
      </LocalizedClientLink>
    )}
  </div>
)

const FooterCategories = ({ categories }: Props) => {
  const byHandle = new Map(categories.map((c) => [c.handle, c]))
  const colunas = COLUNAS.map((col) => ({
    titulo: col.titulo,
    cats: col.handles.map((h) => byHandle.get(h)).filter(Boolean) as NavCat[],
  }))

  // mobile: acordion (uma coluna por bloco, expandível)
  const [aberto, setAberto] = useState<string | null>(null)
  const toggle = (h: string) => setAberto((cur) => (cur === h ? null : h))

  return (
    <>
      {/* DESKTOP / TABLET ≥ md: 3 colunas estáticas */}
      <div className="hidden md:grid md:grid-cols-3 gap-x-8 gap-y-6">
        {colunas.map((col, i) => (
          <div key={i} className="flex flex-col gap-6">
            {col.cats.map((cat) => (
              <BlocoCategoria key={cat.handle} cat={cat} />
            ))}
          </div>
        ))}
      </div>

      {/* MOBILE < md: acordion (1 coluna, expandível por categoria pai) */}
      <div className="md:hidden flex flex-col">
        {categories.map((cat) => {
          const open = aberto === cat.handle
          return (
            <div key={cat.handle} className="border-b border-ui-border-base last:border-b-0">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => toggle(cat.handle)}
                className="flex w-full items-center justify-between py-3 text-left"
              >
                <span className="text-sm font-medium text-ui-fg-base">
                  {cat.name}{" "}
                  <span className="font-normal text-ui-fg-subtle">({cat.count})</span>
                </span>
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden
                  className={`transition-transform ${open ? "rotate-180" : ""}`}>
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {open && (
                <div className="pb-3 pl-3">
                  {cat.subs.length > 0 ? (
                    <>
                      <ul className="flex flex-col gap-1.5">
                        {cat.subs.map((s) => (
                          <li key={s.handle}>
                            <LocalizedClientLink
                              href={`/categories/${s.handle}`}
                              className="text-sm text-ui-fg-subtle hover:text-[#1251b8]"
                            >
                              {s.name}{" "}
                              <span className="text-ui-fg-subtle">({s.count})</span>
                            </LocalizedClientLink>
                          </li>
                        ))}
                      </ul>
                      <LocalizedClientLink
                        href={`/categories/${cat.handle}`}
                        className="mt-2 inline-block text-xs font-medium text-[#1251b8]"
                      >
                        Ver tudo →
                      </LocalizedClientLink>
                    </>
                  ) : (
                    <LocalizedClientLink
                      href={`/categories/${cat.handle}`}
                      className="inline-block text-xs font-medium text-[#1251b8]"
                    >
                      Ver produtos →
                    </LocalizedClientLink>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

export default FooterCategories
