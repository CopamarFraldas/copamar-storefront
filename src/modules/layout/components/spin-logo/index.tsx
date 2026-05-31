"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"

/**
 * Logo do header com DUAS rotações combinadas:
 *  1. Rotação contínua de fundo — "respiração" da marca, 180° a cada 7s.
 *     Como o símbolo Copamar é simétrico a 180° (dois "C" espelhados),
 *     a cada meia-volta ele parece voltar à mesma posição.
 *  2. Rotação por scroll — somada à contínua; ao rolar, o termo do scroll
 *     muda rápido e domina o movimento. Ao parar, sobra só a contínua (suave).
 *
 * Um único requestAnimationFrame lê o scrollY a cada frame e acumula o tempo,
 * então não há "judder" na transição scroll→parado. Respeita prefers-reduced-motion
 * e pausa quando a aba não está visível.
 */
const SpinLogo = () => {
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const SCROLL_FATOR = 0.4 // graus por pixel de scroll
    const CONT_SPEED = reduce ? 0 : 180 / 7000 // graus por ms (180° em 7s; 0 = sem rotação contínua)

    let raf = 0
    let last = performance.now()
    let continua = 0

    const tick = (now: number) => {
      const dt = now - last
      last = now
      if (!document.hidden) continua += dt * CONT_SPEED
      const deg = continua + window.scrollY * SCROLL_FATOR
      el.style.transform = `rotate(${deg}deg)`
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)

    return () => { if (raf) window.cancelAnimationFrame(raf) }
  }, [])

  return (
    <Image
      ref={ref}
      src="/logo.png"
      alt="Copamar Fraldas - Especialista em fraldas geriátricas"
      width={140}
      height={48}
      className="will-change-transform"
      style={{ width: "auto", height: "44px" }}
    />
  )
}

export default SpinLogo
