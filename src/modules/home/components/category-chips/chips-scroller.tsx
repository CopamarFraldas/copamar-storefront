"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Wrapper de scroll horizontal pros chips de categoria (Marco 09/06): em telas
 * menores os chips cortam ("comem" o último, ex.: Absorvente Masculino). Mostra
 * SETINHAS (‹ ›) só quando há corte + fade nas bordas. Some quando tudo cabe
 * (tela grande). Os chips em si são server-rendered e entram como children.
 */
export default function ChipsScroller({
  children,
}: {
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    update()
    const el = ref.current
    if (!el) return
    el.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    // recalcula depois que as fontes/imagens assentam
    const t = setTimeout(update, 300)
    return () => {
      el.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
      clearTimeout(t)
    }
  }, [update])

  const scroll = (dir: number) =>
    ref.current?.scrollBy({ left: dir * 240, behavior: "smooth" })

  const Seta = ({ lado }: { lado: "esq" | "dir" }) => (
    <button
      type="button"
      onClick={() => scroll(lado === "esq" ? -1 : 1)}
      aria-label={lado === "esq" ? "Ver categorias anteriores" : "Ver mais categorias"}
      className={`absolute top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-ui-border-base bg-ui-bg-base text-copamar-primary shadow-md transition hover:bg-copamar-primary/10 ${
        lado === "esq" ? "left-0" : "right-0"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={lado === "esq" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
      </svg>
    </button>
  )

  return (
    <div className="relative min-w-0 flex-1">
      {canLeft && (
        <>
          <Seta lado="esq" />
          <span className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-ui-bg-base to-transparent" />
        </>
      )}
      <div
        ref={ref}
        className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {canRight && (
        <>
          <span className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-ui-bg-base to-transparent" />
          <Seta lado="dir" />
        </>
      )}
    </div>
  )
}
