"use client"

import { useEffect, useRef, useState } from "react"

/**
 * 🌀 Visualizador 360° (Marco 07/06 — "achei sensacional" no site da Tena):
 * 36 frames oficiais (10° por frame); ARRASTE pra girar (touch e mouse).
 * Auto-gira 1 volta lenta ao entrar na tela pra convidar a interação.
 * Frames em /public/produtos/tena/<linha>/360/f00..f35.jpg (metadata.spin360).
 */
export default function Spin360({ basePath, alt }: { basePath: string; alt: string }) {
  const FRAMES = 36
  const [frame, setFrame] = useState(0)
  const [carregado, setCarregado] = useState(false)
  const [interagiu, setInteragiu] = useState(false)
  const drag = useRef<{ x: number; frame: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const src = (n: number) =>
    `${basePath}/f${String(((n % FRAMES) + FRAMES) % FRAMES).padStart(2, "0")}.jpg`

  // pré-carrega os frames (depois do 1º render)
  useEffect(() => {
    let vivos = 0
    for (let i = 0; i < FRAMES; i++) {
      const img = new Image()
      img.onload = () => {
        vivos++
        if (vivos >= FRAMES - 2) setCarregado(true)
      }
      img.src = src(i)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath])

  // auto-gira 1 volta quando visível (e ainda sem interação)
  useEffect(() => {
    if (!carregado || interagiu) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    const el = rootRef.current
    if (!el) return
    let raf = 0
    let girado = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        const passo = () => {
          if (girado >= FRAMES || drag.current) return
          girado++
          setFrame((f) => (f + 1) % FRAMES)
          raf = window.setTimeout(passo, 90) as unknown as number
        }
        passo()
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      clearTimeout(raf)
    }
  }, [carregado, interagiu])

  const onDown = (x: number) => {
    setInteragiu(true)
    drag.current = { x, frame }
  }
  const onMove = (x: number) => {
    if (!drag.current) return
    const delta = Math.round((x - drag.current.x) / 12) // 12px por frame
    setFrame((((drag.current.frame - delta) % FRAMES) + FRAMES) % FRAMES)
  }
  const onUp = () => (drag.current = null)

  return (
    <div
      ref={rootRef}
      className="relative select-none overflow-hidden rounded-large bg-white p-2 shadow-elevation-card-rest"
      data-testid="spin-360"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src(frame)}
        alt={`${alt} — visão 360°`}
        draggable={false}
        className="aspect-[4/3] w-full cursor-grab object-contain active:cursor-grabbing"
        onMouseDown={(e) => {
          e.preventDefault()
          onDown(e.clientX)
        }}
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={(e) => onDown(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onUp}
      />
      <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M21 12a9 9 0 1 1-9-9" />
          <path d="M21 3v9h-9" />
        </svg>
        Arraste para girar · 360°
      </div>
    </div>
  )
}
