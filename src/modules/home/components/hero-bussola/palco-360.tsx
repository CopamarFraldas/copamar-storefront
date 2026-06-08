"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import Spin360 from "@modules/products/components/spin-360"

/**
 * Palco do 360 no Hero — REUSA o Spin360 das PDPs (não reescreve): só passa
 * basePath/alt por prop e key. Acrescenta, em volta:
 *  - poster estático (uma das 121 fotos) que reserva a altura → zero CLS;
 *  - lazy via IntersectionObserver: o Spin360 (e seus frames) só monta quando
 *    o palco entra na viewport;
 *  - "produto que escuta": inclina de leve na direção do chip em foco;
 *  - loader com o fantasminha do Pac-Man enquanto o 360 acorda.
 * Reduced-motion: sem inclinação (o auto-giro já é desligado dentro do Spin360).
 */
export default function Palco360({
  basePath,
  poster,
  alt,
  tilt = 0,
}: {
  basePath: string
  poster: string
  alt: string
  /** graus de inclinação (negativo = esquerda, positivo = direita) */
  tilt?: number
}) {
  const reduzir = !!useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      setVisivel(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisivel(true)
          io.disconnect()
        }
      },
      { threshold: 0.25 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const tiltAplicado = reduzir ? 0 : tilt

  return (
    <div
      ref={ref}
      className="relative mx-auto aspect-[4/3] w-full max-w-md"
      style={{
        transform: `rotate(${tiltAplicado}deg)`,
        transition: "transform 400ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* poster por baixo: reserva altura (anti-CLS) e é o fundo enquanto o
          360 não montou / troca de produto */}
      <Image
        src={poster}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 90vw, 460px"
        className="rounded-large bg-white object-contain p-2"
        priority={false}
      />

      {/* 360 reusado — remonta a cada produto (key) e só quando visível */}
      {visivel && basePath && (
        <div key={basePath} className="absolute inset-0">
          <Spin360 basePath={basePath} alt={alt} />
        </div>
      )}

      {/* loader fantasminha enquanto o palco ainda não entrou em cena */}
      {!visivel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden className="animate-pulse">
            <path
              d="M2 12 a10 10 0 0 1 20 0 v9 l-3.3-2.6 -3.3 2.6 -3.4-2.6 -3.3 2.6 -3.4-2.6 Z"
              fill="#ef7e1a"
            />
            <circle cx="9" cy="11" r="2.4" fill="#fff" />
            <circle cx="15" cy="11" r="2.4" fill="#fff" />
            <circle cx="9.6" cy="11" r="1.1" fill="#1e293b" />
            <circle cx="15.6" cy="11" r="1.1" fill="#1e293b" />
          </svg>
        </div>
      )}
    </div>
  )
}
