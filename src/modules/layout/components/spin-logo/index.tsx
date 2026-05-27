"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"

/**
 * Logo que rotaciona conforme o scroll da página.
 * Desce → gira num sentido; sobe → gira no sentido inverso (a rotação acompanha
 * a posição do scroll, então voltar pro topo desfaz o giro). Usa rAF p/ suavidade.
 */
const SpinLogo = () => {
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    let raf = 0
    const FATOR = 0.4 // graus por pixel de scroll (~900px = 1 volta completa)

    const update = () => {
      raf = 0
      const el = ref.current
      if (el) {
        const deg = window.scrollY * FATOR
        el.style.transform = `rotate(${deg}deg)`
      }
    }
    const onScroll = () => {
      // agenda 1 update por frame (evita thrashing de layout)
      if (!raf) raf = window.requestAnimationFrame(update)
    }

    update() // estado inicial (caso a página abra já rolada)
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
      priority
      className="will-change-transform"
      style={{ width: "auto", height: "44px", transition: "transform 80ms linear" }}
    />
  )
}

export default SpinLogo
