"use client"

/**
 * VARIANTE B do A/B do banner do topo (10/07): carrossel ESTÁTICO acessível,
 * no lugar da esteira infinita — a super análise apontou ressalva WCAG 2.2.2
 * (conteúdo em movimento sem pausa = alvo móvel pro público 45-65).
 *
 * Mesmos painéis/links da esteira (admin /store/banners, fallback compartilhado):
 *  - troca automática a cada 6s, UM painel por vez;
 *  - setas ‹ › grandes (48px, acima do mínimo de 44px) e pontinhos clicáveis;
 *  - PAUSA a rotação em hover, foco (teclado) e toque (12s após o último toque);
 *  - prefers-reduced-motion: vira estático (sem rotação nem transição), setas
 *    e pontinhos continuam funcionando;
 *  - aba em segundo plano (document.hidden) não avança.
 *
 * Sem lib nova — só React + CSS transition. Mesma altura da esteira
 * (--eh 140px mobile / 200px desktop no topo) → zero layout shift entre variantes.
 * banner_click medido aqui; banner_view fica no wrapper banner-topo-ab.
 */

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

import { BANNERS_FALLBACK, type BannerInput } from "@modules/home/components/banner-esteira"
import { painelId, trackBanner } from "@lib/tracking/banner-ab"

const INTERVALO_MS = 6000
const PAUSA_TOQUE_MS = 12000

export default function BannerCarrossel({
  altura = 240,
  alturaMobile,
  prioridade = false,
  banners,
}: {
  altura?: number
  alturaMobile?: number
  /** true quando é o 1º elemento da página (1ª imagem com priority p/ LCP) */
  prioridade?: boolean
  banners?: BannerInput[]
}) {
  const bs = banners && banners.length ? banners : BANNERS_FALLBACK
  const n = bs.length
  const hMobile = alturaMobile ?? altura

  const [idx, setIdx] = useState(0)
  const [hover, setHover] = useState(false)
  const [foco, setFoco] = useState(false)
  const [reduzido, setReduzido] = useState(false)
  // bump a cada navegação manual → reinicia a janela de 6s (senão a seta
  // clicada no 5º segundo avançaria de novo 1s depois)
  const [cicloKey, setCicloKey] = useState(0)
  const toqueAteRef = useRef(0)
  const pausado = hover || foco

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduzido(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduzido(e.matches)
    mq.addEventListener?.("change", onChange)
    return () => mq.removeEventListener?.("change", onChange)
  }, [])

  useEffect(() => {
    if (reduzido || pausado || n <= 1) return
    const t = setInterval(() => {
      // aba escondida ou toque recente → segura a vez, sem matar o intervalo
      if (document.hidden || Date.now() < toqueAteRef.current) return
      setIdx((i) => (i + 1) % n)
    }, INTERVALO_MS)
    return () => clearInterval(t)
  }, [reduzido, pausado, n, cicloKey])

  const irPara = useCallback(
    (i: number) => {
      setIdx(((i % n) + n) % n)
      setCicloKey((k) => k + 1)
    },
    [n]
  )

  return (
    <section
      className="bcar-wrap relative w-full overflow-hidden bg-copamar-bg-light dark:bg-ui-bg-subtle"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Ofertas e diferenciais Copamar"
      // toque em mobile dispara mouseenter/focus SINTÉTICOS que nunca ganham o
      // mouseleave/blur de volta → hover/foco ficariam presos em true e a
      // rotação pararia pra sempre no 1º toque. Dentro da janela de toque
      // (12s) esses eventos são ignorados — a pausa do toque já cobre o caso;
      // mouse e teclado de verdade (sem toque recente) seguem pausando normal.
      onMouseEnter={() => {
        if (Date.now() < toqueAteRef.current) return
        setHover(true)
      }}
      onMouseLeave={() => setHover(false)}
      onFocus={() => {
        if (Date.now() < toqueAteRef.current) return
        setFoco(true)
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFoco(false)
      }}
      onTouchStart={() => {
        toqueAteRef.current = Date.now() + PAUSA_TOQUE_MS
      }}
    >
      <style>{`
        .bcar-wrap { --eh: ${hMobile}px }
        @media (min-width: 768px) { .bcar-wrap { --eh: ${altura}px } }
      `}</style>

      {/* trilho: cada painel ocupa 100% da largura; translateX troca o painel */}
      <div
        className={`flex ${reduzido ? "" : "transition-transform duration-500 ease-out"}`}
        style={{ transform: `translateX(-${idx * 100}%)`, height: "var(--eh)" }}
      >
        {bs.map((b, i) => {
          const ativo = i === idx
          // ativo + vizinhos carregam eager (o próximo fica pronto nos 6s de
          // folga); o resto lazy — senão o carrossel baixa as 10 artes de vez
          const vizinho = i === (idx + 1) % n || i === (idx - 1 + n) % n
          const img = (
            <Image
              src={b.image_url}
              alt=""
              width={0}
              height={0}
              sizes="(max-width: 767px) 460px, 680px"
              quality={70}
              draggable={false}
              className="block w-auto select-none"
              style={{ height: "var(--eh)", width: "auto", maxWidth: "100%", objectFit: "contain" }}
              {...(prioridade && i === 0
                ? { priority: true }
                : { loading: (ativo || vizinho ? "eager" : "lazy") as "eager" | "lazy" })}
            />
          )
          return (
            <div
              key={i}
              role="group"
              aria-roledescription="painel"
              aria-label={`Painel ${i + 1} de ${n}`}
              aria-hidden={!ativo}
              className="flex h-full w-full shrink-0 items-center justify-center"
            >
              {b.link ? (
                <a
                  href={b.link}
                  className="block h-full"
                  aria-label="Ver oferta"
                  tabIndex={ativo ? 0 : -1}
                  onClick={() =>
                    trackBanner("banner_click", { variante: "carrossel", painel: painelId(b) })
                  }
                >
                  {img}
                </a>
              ) : (
                img
              )}
            </div>
          )
        })}
      </div>

      {/* setas grandes (48px ≥ alvo mínimo 44px) */}
      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => irPara(idx - 1)}
            aria-label="Painel anterior"
            className="absolute left-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 pb-1 text-3xl font-bold leading-none text-copamar-primary shadow-md ring-1 ring-black/10 transition-colors hover:bg-white"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => irPara(idx + 1)}
            aria-label="Próximo painel"
            className="absolute right-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 pb-1 text-3xl font-bold leading-none text-copamar-primary shadow-md ring-1 ring-black/10 transition-colors hover:bg-white"
          >
            ›
          </button>

          {/* pontinhos: área de toque 28×44px por ponto (10 pontos cabem no 375px) */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center">
            {bs.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => irPara(i)}
                aria-label={`Ir para o painel ${i + 1}`}
                aria-current={i === idx ? "true" : undefined}
                className="flex h-11 w-7 items-center justify-center"
              >
                <span
                  className={`block rounded-full ring-1 ring-black/25 transition-all ${
                    i === idx ? "h-3.5 w-3.5 bg-copamar-primary" : "h-2.5 w-2.5 bg-white/95"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
