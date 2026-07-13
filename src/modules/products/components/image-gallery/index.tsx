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
  const thumbsRef = useRef<HTMLDivElement>(null)
  const palcoRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  // altura real do palco (foto grande, quadrado) → a tira de miniaturas trava
  // NA MESMA altura no desktop (Marco 15/06: "deixa a barra na mesma altura das
  // fotos"); com scroll interno quando há mais miniaturas que cabem.
  const [palcoH, setPalcoH] = useState<number | null>(null)

  const valid = images.filter((i) => !!i.url)
  const count = valid.length

  // sincroniza a miniatura/seta ativa conforme o usuário arrasta/scrolla o palco
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

  // mantém a miniatura ativa sempre visível na tira (vertical no PC, horizontal no mobile)
  useEffect(() => {
    const alvo = thumbsRef.current?.querySelector<HTMLElement>(`[data-thumb="${active}"]`)
    alvo?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" })
  }, [active])

  // mede o palco e reflete a altura na tira (acompanha resize/zoom)
  useEffect(() => {
    const el = palcoRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => setPalcoH(el.clientHeight))
    ro.observe(el)
    setPalcoH(el.clientHeight)
    return () => ro.disconnect()
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
    // Galeria estilo Tena (Marco 15/06): MINIATURAS clicáveis na LATERAL no desktop
    // / EMBAIXO no mobile + palco grande. As fotos já vêm linkadas no produto
    // (renders R2 + galeria oficial). Com 1 foto só, a tira de miniaturas some.
    <div className="flex flex-col gap-3 small:flex-row small:items-start small:gap-4">
      {/* tira de miniaturas — só aparece com 2+ fotos */}
      {count > 1 && (
        <div
          ref={thumbsRef}
          role="tablist"
          aria-label="Miniaturas do produto"
          style={palcoH ? { maxHeight: `${palcoH}px` } : undefined}
          className="order-last flex shrink-0 gap-2 overflow-x-auto pb-1 small:order-first small:max-h-[440px] small:flex-col small:overflow-x-visible small:overflow-y-auto small:pb-0 small:pr-1 [scrollbar-width:thin]"
        >
          {valid.map((image, index) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              data-thumb={index}
              aria-selected={index === active}
              aria-label={`Ver foto ${index + 1} de ${count}`}
              onClick={() => goTo(index)}
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-rounded border-2 bg-white transition small:h-[60px] small:w-[60px] ${
                index === active
                  ? "border-ui-border-interactive"
                  : "border-ui-border-base hover:border-ui-border-interactive"
              }`}
            >
              <Image
                src={image.url!}
                alt={title ? `${title} — miniatura ${index + 1}` : `Miniatura ${index + 1}`}
                fill
                sizes="60px"
                style={{ objectFit: "contain" }}
                className="p-0.5"
              />
            </button>
          ))}
        </div>
      )}

      {/* PALCO: carrossel com scroll-snap (1 foto por vez), foto grande.
          A ALTURA vem do aspect-ratio em bloco; os slides são h-full —
          evita o colapso de altura que o aspect-ratio sofre em flex-row.
          Mobile enxuto (400px, Marco 28/05); no PC preenche a coluna (flex-1). */}
      <div ref={palcoRef} className="relative mx-auto aspect-[1/1] w-full max-w-[400px] small:mx-0 small:max-w-none small:flex-1">
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
                sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 460px"
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

            {/* contador discreto (substitui os dots; as miniaturas já mostram a posição) */}
            <div className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
              {active + 1}/{count}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ImageGallery
