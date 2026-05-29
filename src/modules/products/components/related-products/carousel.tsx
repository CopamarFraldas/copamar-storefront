"use client"

import { useEffect, useRef, useState } from "react"
import Product from "../product-preview"
import { HttpTypes } from "@medusajs/types"

type Props = {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
}

/**
 * Carrossel horizontal de produtos relacionados. 1 fileira que rola pro lado.
 * Estilo das setas reaproveita o image-gallery (consistência visual).
 * Mobile: swipe puro (scroll-snap), sem setas.
 * Setas só aparecem quando há overflow (mais cards do que caberia na tela).
 */
const RelatedProductsCarousel = ({ products, region }: Props) => {
  const trackRef = useRef<HTMLUListElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const checkOverflow = () => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    checkOverflow()
    const el = trackRef.current
    if (!el) return
    const onScroll = () => checkOverflow()
    el.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      el.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [products.length])

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    // rola ~75% da largura visível (1 "tela" de cards)
    el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: "smooth" })
  }

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        className="flex gap-x-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <li
            key={p.id}
            // larguras escolhidas pra DEIXAR O PRÓXIMO ESPIANDO na borda direita:
            // mobile: 70% (1 card e meio espiando), tablet 42% (~2.3 cards), desktop 30% (~3.3 cards)
            className="snap-start shrink-0 w-[70%] xsmall:w-[55%] small:w-[42%] medium:w-[30%] large:w-[24%]"
          >
            <Product region={region} product={p} />
          </li>
        ))}
      </ul>

      {/* setas só desktop e só quando dá pra rolar */}
      <button
        type="button"
        aria-label="Anteriores"
        onClick={() => scrollBy(-1)}
        disabled={!canPrev}
        className={`hidden small:flex absolute left-2 top-[40%] -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:bg-white disabled:opacity-0 disabled:pointer-events-none`}
      >
        <span className="text-2xl leading-none text-ui-fg-base">‹</span>
      </button>
      <button
        type="button"
        aria-label="Próximos"
        onClick={() => scrollBy(1)}
        disabled={!canNext}
        className={`hidden small:flex absolute right-2 top-[40%] -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:bg-white disabled:opacity-0 disabled:pointer-events-none`}
      >
        <span className="text-2xl leading-none text-ui-fg-base">›</span>
      </button>
    </div>
  )
}

export default RelatedProductsCarousel
