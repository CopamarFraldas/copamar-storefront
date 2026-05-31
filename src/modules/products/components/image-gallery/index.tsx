"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useRef, useState, useEffect } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  /** nome do produto → alt descritivo por foto (a11y/SEO) */
  title?: string
}

const ImageGallery = ({ images, title }: ImageGalleryProps) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const valid = images.filter((i) => !!i.url)
  const count = valid.length

  // sincroniza o dot ativo conforme o usuário arrasta/scrolla
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth)
      setActive(idx)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  const goTo = (idx: number) => {
    const el = trackRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(count - 1, idx))
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" })
    setActive(clamped)
  }

  if (count === 0) return null

  return (
    // a ALTURA vem daqui (aspect-ratio em bloco). Os slides são h-full —
    // evita o colapso de altura que o aspect-ratio sofre dentro de flex-row.
    // aspect-[1/1] + max-w/max-h 400px: galeria enxuta (Marco 28/05).
    // Iterações: 29/34 (colossal ~930px) → 600 → 500 → 400 (parou).
    <div className="relative w-full mx-auto aspect-[1/1] max-w-[400px] max-h-[400px]">
      {/* trilho com scroll-snap: 1 foto por vez */}
      <div
        ref={trackRef}
        className="absolute inset-0 flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-rounded [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {valid.map((image, index) => (
          <div
            key={image.id}
            className="relative h-full w-full shrink-0 snap-center bg-white"
            id={image.id}
          >
            <Image
              src={image.url!}
              priority={index === 0}
              className="absolute inset-0"
              alt={title ? `${title} — foto ${index + 1}` : `Imagem do produto ${index + 1}`}
              fill
              sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 700px"
              style={{ objectFit: "contain" }}
            />
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          {/* setas ← → */}
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur transition hover:bg-ui-bg-base disabled:opacity-0"
          >
            <span className="text-xl leading-none">‹</span>
          </button>
          <button
            type="button"
            aria-label="Próxima foto"
            onClick={() => goTo(active + 1)}
            disabled={active === count - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur transition hover:bg-ui-bg-base disabled:opacity-0"
          >
            <span className="text-xl leading-none">›</span>
          </button>

          {/* dots */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {valid.map((_, index) => (
              <button
                type="button"
                key={index}
                aria-label={`Ir para foto ${index + 1}`}
                onClick={() => goTo(index)}
                className={`h-2 rounded-full transition-all ${
                  index === active ? "w-5 bg-ui-fg-base" : "w-2 bg-ui-fg-muted/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default ImageGallery
