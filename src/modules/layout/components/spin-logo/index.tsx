"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"

/**
 * Logo do header que gira SOMENTE com o scroll (Marco 07/06: removida a
 * rotação contínua de "respiração" — ela girava sozinha mesmo com a página
 * parada). O ângulo acompanha a posição do scroll: rolou → girou; parou →
 * ficou parado. Como o símbolo Copamar é simétrico a 180°, voltar ao topo
 * realinha naturalmente.
 *
 * Sem loop perpétuo de rAF: o transform só é recalculado enquanto há scroll
 * (1 frame throttle), então NADA roda com a página em repouso. Respeita
 * prefers-reduced-motion.
 */
const SpinLogo = ({ className = "h-11" }: { className?: string }) => {
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return

    const SCROLL_FATOR = 0.4 // graus por pixel de scroll
    let raf = 0

    const aplicar = () => {
      raf = 0
      el.style.transform = `rotate(${window.scrollY * SCROLL_FATOR}deg)`
    }
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(aplicar)
    }

    aplicar() // alinha à posição atual (caso a página abra já rolada)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <Image
      ref={ref}
      src="/logo.png"
      alt="Copamar Fraldas - Especialista em fraldas geriátricas"
      width={140}
      height={48}
      // altura via className (mobile usa logo maior que o desktop — ajuste 04/06)
      className={`w-auto will-change-transform ${className}`}
    />
  )
}

export default SpinLogo
