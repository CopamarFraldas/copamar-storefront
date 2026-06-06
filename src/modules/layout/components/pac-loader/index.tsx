"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

/**
 * 👻 Pac-Loader (mimo do Marco, 06/06): enquanto a página carrega, um
 * fantasminha do Pac-Man percorre um anel de bolinhas AO REDOR do logo
 * giratório, comendo-as até fechar a volta. Some quando termina.
 *
 * - Carga inicial: anda até o window load.
 * - Navegação SPA: começa no clique em link interno; completa quando o
 *   pathname muda (App Router não expõe eventos de rota — padrão da casa).
 * - nprogress-like: avança rápido até ~80% e espera o "pronto" pra fechar.
 * - Cor do fantasma alterna a cada carga (Blinky/Pinky/Inky/Clyde 🟥🩷🩵🟧).
 * - Decorativo: aria-hidden; respeita prefers-reduced-motion.
 */

const DOTS = 14
const CORES = ["#f43f5e", "#f9a8d4", "#22d3ee", "#fb923c"]

export default function PacLoader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [progresso, setProgresso] = useState(0)
  const [ativo, setAtivo] = useState(false)
  const [cor, setCor] = useState(0)

  // estado da animação fora do React (loop rAF estável)
  const st = useRef({ prog: 0, alvo: 0, rodando: false, raf: 0, guarda: 0 as any })

  const tick = () => {
    const s = st.current
    if (!s.rodando) return
    // Curva HOMOGÊNEA (ajuste Marco 06/06): andamento quase constante, sem
    // arrancada; perto do fim da carga ele RASTEJA (nunca para seco); o
    // fechamento pós-load é suave (~1s), não um teleporte.
    let passo: number
    if (s.alvo >= 1) {
      // página pronta → fecha a volta suave
      passo = Math.min(0.008, 0.003 + (1 - s.prog) * 0.015)
    } else {
      // carregando → desacelera gradualmente, rastejo mínimo sempre
      const dist = Math.max(0.05, 0.95 - s.prog)
      passo = Math.max(0.0008, dist * 0.01)
    }
    s.prog = Math.min(s.alvo >= 1 ? 1 : 0.95, s.prog + passo)
    setProgresso(s.prog)
    if (s.prog >= 1) {
      // volta completa → fade (350ms) → some e reseta
      setTimeout(() => {
        s.rodando = false
        s.prog = 0
        setAtivo(false)
        setProgresso(0)
      }, 350)
      return
    }
    s.raf = requestAnimationFrame(tick)
  }

  const start = () => {
    const s = st.current
    if (s.rodando) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    s.rodando = true
    s.prog = 0
    s.alvo = 0.95 // teto da fase de carga (com rastejo — nunca para seco)
    setCor((c) => (c + 1) % CORES.length)
    setProgresso(0)
    setAtivo(true)
    cancelAnimationFrame(s.raf)
    s.raf = requestAnimationFrame(tick)
    clearTimeout(s.guarda)
    s.guarda = setTimeout(done, 12_000) // nunca fica preso
  }

  const done = () => {
    const s = st.current
    if (!s.rodando) return
    s.alvo = 1
  }

  // carga inicial da página
  useEffect(() => {
    if (document.readyState !== "complete") {
      start()
      window.addEventListener("load", done, { once: true })
      return () => window.removeEventListener("load", done)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // clique em link interno = começa
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement)?.closest?.("a")
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return
      const href = a.getAttribute("href") || ""
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return
      try {
        const url = new URL(href, location.href)
        if (url.origin !== location.origin) return
        if (url.pathname === location.pathname && url.search === location.search) return
        start()
      } catch {
        /* href inválido */
      }
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // pathname mudou = rota nova montada → fecha a volta (pula o run do mount)
  const primeiraRota = useRef(true)
  useEffect(() => {
    if (primeiraRota.current) {
      primeiraRota.current = false
      return
    }
    done()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(
    () => () => {
      cancelAnimationFrame(st.current.raf)
      clearTimeout(st.current.guarda)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    []
  )

  // geometria: anel ao redor do logo (viewBox 100×100, raio 46)
  const R = 46
  const anguloFantasma = progresso * 360 - 90 // topo, sentido horário
  const rad = (anguloFantasma * Math.PI) / 180
  const fx = 50 + R * Math.cos(rad)
  const fy = 50 + R * Math.sin(rad)

  return (
    <span className="relative inline-flex items-center justify-center">
      {children}
      {ativo && (
        <svg
          viewBox="0 0 100 100"
          aria-hidden
          data-pacloader
          className="pointer-events-none absolute -inset-[7px] h-[calc(100%+14px)] w-[calc(100%+14px)] transition-opacity duration-300"
          style={{ opacity: progresso >= 1 ? 0 : 1 }}
        >
          {Array.from({ length: DOTS }, (_, i) => {
            const ang = (i / DOTS) * 360 - 90
            const comida = ((ang + 90 + 360) % 360) <= progresso * 360
            if (comida) return null
            const a = (ang * Math.PI) / 180
            return (
              <circle
                key={i}
                cx={50 + R * Math.cos(a)}
                cy={50 + R * Math.sin(a)}
                r="2.2"
                className="fill-ui-fg-muted"
                opacity="0.8"
              />
            )
          })}
          <g transform={`translate(${fx} ${fy}) rotate(${anguloFantasma + 90})`}>
            <g transform="translate(-6 -6.5)">
              <path
                d="M0 6 a6 6 0 0 1 12 0 v5.5 l-2 -1.6 -2 1.6 -2 -1.6 -2 1.6 -2 -1.6 -2 1.6 Z"
                fill={CORES[cor]}
              />
              <circle cx="3.8" cy="5.4" r="1.7" fill="#fff" />
              <circle cx="8.2" cy="5.4" r="1.7" fill="#fff" />
              <circle cx="4.5" cy="5.0" r="0.85" fill="#1e293b" />
              <circle cx="8.9" cy="5.0" r="0.85" fill="#1e293b" />
            </g>
          </g>
        </svg>
      )}
    </span>
  )
}
