"use client"

import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useEffect, useRef } from "react"

type Card = { handle: string; name: string; count: number; thumbnail: string | null }

/**
 * Seção "Nossos Produtos" com 8 cards de categoria. Tilt 3D + fade-in scroll.
 * IntersectionObserver dispara a animação quando os cards entram no viewport,
 * com stagger de 100ms entre eles. Respeita prefers-reduced-motion.
 */
const CategoriesSectionClient = ({ cards }: { cards: Card[] }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-card]"))

    if (reduce) {
      // sem animação — só mostra
      items.forEach((el) => { el.style.opacity = "1"; el.style.transform = "translateY(0)" })
      return
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const idx = items.indexOf(entry.target as HTMLElement)
        const delay = Math.max(0, idx) * 100
        ;(entry.target as HTMLElement).style.transitionDelay = `${delay}ms`
        ;(entry.target as HTMLElement).style.opacity = "1"
        ;(entry.target as HTMLElement).style.transform = "translateY(0)"
        io.unobserve(entry.target)
      })
    }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" })

    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section id="categorias" className="bg-ui-bg-base py-12 lg:py-20" ref={ref}>
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
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1251b8] focus-visible:ring-offset-2
                opacity-0 translate-y-8"
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
              <span className="inline-block rounded-full bg-orange-500 text-white text-xs font-medium px-2.5 py-1">
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
