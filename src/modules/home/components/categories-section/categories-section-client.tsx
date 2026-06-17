"use client"

import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Card = { handle: string; name: string; count: number; thumbnail: string | null }

/**
 * Seção "Navegue por categoria" — 8 cards SEMPRE visíveis (sem fade-in on-scroll,
 * que adiava conteúdo e arriscava buraco branco se o JS/observer falhasse). Como
 * Amazon/ML: cards de categoria aparecem na hora. A "vida" vem do hover (tilt 3D)
 * e das fotos — não de animação de entrada. Mais rápido e robusto no mobile.
 */
const CategoriesSectionClient = ({ cards }: { cards: Card[] }) => {
  return (
    <section id="categorias" className="bg-ui-bg-base py-12 lg:py-20">
      <div className="content-container max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2 text-ui-fg-base">Navegue por categoria</h2>
        <p className="text-center text-ui-fg-subtle mb-10 lg:mb-12">
          Catálogo completo pra cuidar de quem você ama
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((c, i) => (
            <LocalizedClientLink
              key={c.handle}
              href={`/categories/${c.handle}`}
              data-card
              data-index={i}
              className="group relative flex flex-col items-center overflow-hidden rounded-2xl bg-white dark:bg-ui-bg-component p-6 shadow-md transition-all duration-300 ease-out
                hover:shadow-2xl hover:-translate-y-1 hover:[transform:perspective(1000px)_rotateX(2deg)_rotateY(-2deg)_translateY(-4px)]
                border-l-4 border-transparent hover:border-[#1251b8]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1251b8] focus-visible:ring-offset-2"
            >
              <div className="relative w-full max-h-48 aspect-square mb-4 overflow-hidden rounded-xl bg-white">
                {c.thumbnail ? (
                  <Image
                    src={c.thumbnail}
                    alt={`Categoria ${c.name} — produto representativo`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  /* fallback: gradiente Copamar */
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1251b8] to-[#3b82f6] flex items-center justify-center text-white text-3xl font-bold">
                    {c.name.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold text-center text-ui-fg-base mb-2">{c.name}</h3>
              <span className="inline-block rounded-full bg-copamar-cta text-[#0a2e6b] text-xs font-medium px-2.5 py-1">
                {c.count} produtos
              </span>
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CategoriesSectionClient
