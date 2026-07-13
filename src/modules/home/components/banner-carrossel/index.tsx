"use client"

/**
 * VARIANTE B do A/B do banner do topo (10/07): carrossel acessível, UM painel
 * por vez, no lugar da esteira infinita — a super análise apontou ressalva
 * WCAG 2.2.2 (conteúdo em movimento sem pausa = alvo móvel pro público 45-65).
 *
 * 12/07 (pedido do Marco): loop INFINITO nos dois sentidos — o último painel
 * desliza pro primeiro (e vice-versa) sem "rebobinar" o trilho inteiro.
 * Técnica dos CLONES: trilho estendido [último, ...reais, primeiro]; quando a
 * transição termina num clone, teleporta SEM animação pro painel real
 * equivalente (ninguém percebe a emenda).
 *
 * Mesmos painéis/links da esteira (admin /store/banners, fallback compartilhado):
 *  - troca automática a cada 6s, UM painel por vez;
 *  - setas ‹ › (alvo ≥44px): desktop aparece no hover/foco, mobile sempre
 *    visível e discreta; pontinhos clicáveis SINCRONIZADOS (seta/autoplay
 *    também movem o pontinho ativo — inclusive na volta último→primeiro);
 *  - seta/pontinho reinicia a janela de 6s; PAUSA em hover, foco (teclado) e
 *    toque (retoma ~8s após o último toque — nunca congela pra sempre, já
 *    tivemos esse bug de tap mobile);
 *  - prefers-reduced-motion: sem rotação nem transição (troca instantânea),
 *    setas e pontinhos continuam funcionando;
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
const PAUSA_TOQUE_MS = 8000
const TRANSICAO_MS = 500

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

  // 1 banner só dispensa loop/clones (e as setas/pontinhos nem renderizam)
  const temLoop = n > 1
  // trilho estendido: clone do último na frente + clone do primeiro no fim
  const ext = temLoop ? [bs[n - 1], ...bs, bs[0]] : bs

  // pos indexa o trilho ESTENDIDO (1..n = reais; 0 e n+1 = clones)
  const [pos, setPos] = useState(temLoop ? 1 : 0)
  // true por 1 frame durante o teleporte clone→real (desliga a transição CSS)
  const [semTransicao, setSemTransicao] = useState(false)
  const [hover, setHover] = useState(false)
  const [foco, setFoco] = useState(false)
  const [reduzido, setReduzido] = useState(false)
  // bump a cada navegação manual → reinicia a janela de 6s (senão a seta
  // clicada no 5º segundo avançaria de novo 1s depois)
  const [cicloKey, setCicloKey] = useState(0)
  const toqueAteRef = useRef(0)
  const pausado = hover || foco

  // painel real ativo (bolinhas): nos clones aponta pro real equivalente,
  // então a bolinha já avança pra frente durante a volta último→primeiro
  const idxReal = temLoop ? (((pos - 1) % n) + n) % n : 0

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduzido(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduzido(e.matches)
    mq.addEventListener?.("change", onChange)
    return () => mq.removeEventListener?.("change", onChange)
  }, [])

  useEffect(() => {
    if (reduzido || pausado || !temLoop) return
    const t = setInterval(() => {
      // aba escondida ou toque recente → segura a vez, sem matar o intervalo
      if (document.hidden || Date.now() < toqueAteRef.current) return
      // se ainda está no clone (teleporte pendente), espera o próximo tick
      setPos((p) => (p >= n + 1 ? p : p + 1))
    }, INTERVALO_MS)
    return () => clearInterval(t)
  }, [reduzido, pausado, temLoop, n, cicloKey])

  // teleporte clone→real, sem animação (o coração do loop infinito)
  const snap = useCallback(
    (p: number) => {
      if (!temLoop || (p !== 0 && p !== n + 1)) return
      setSemTransicao(true)
      setPos(p === 0 ? n : 1)
    },
    [temLoop, n]
  )

  // rede de segurança: se o transitionend não vier (aba escondida, etc.),
  // teleporta mesmo assim — senão o carrossel encalha no clone
  useEffect(() => {
    if (!temLoop || (pos !== 0 && pos !== n + 1)) return
    const t = setTimeout(() => snap(pos), TRANSICAO_MS + 150)
    return () => clearTimeout(t)
  }, [pos, temLoop, n, snap])

  // religa a transição só DEPOIS do paint na posição real (2 frames)
  useEffect(() => {
    if (!semTransicao) return
    let id2 = 0
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setSemTransicao(false))
    })
    return () => {
      cancelAnimationFrame(id1)
      cancelAnimationFrame(id2)
    }
  }, [semTransicao])

  // bolinhas: vai direto ao painel real i (0-based)
  const irPara = useCallback(
    (i: number) => {
      if (!temLoop) return
      setPos((((i % n) + n) % n) + 1)
      setCicloKey((k) => k + 1)
    },
    [temLoop, n]
  )

  // setas: um passo pro lado (com loop nos dois sentidos)
  const passo = useCallback(
    (delta: number) => {
      setCicloKey((k) => k + 1)
      setPos((p) => {
        if (reduzido) {
          // sem transição não precisa de clone: pula modular direto no real
          return ((((p - 1 + delta) % n) + n) % n) + 1
        }
        const alvo = p + delta
        // já além do clone (teleporte a caminho) → segura o clique (~0,5s)
        return alvo < 0 || alvo > n + 1 ? p : alvo
      })
    },
    [reduzido, n]
  )

  return (
    <section
      className="bcar-wrap group relative w-full overflow-hidden bg-copamar-bg-light dark:bg-ui-bg-subtle"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Ofertas e diferenciais Copamar"
      // toque em mobile dispara mouseenter/focus SINTÉTICOS que nunca ganham o
      // mouseleave/blur de volta → hover/foco ficariam presos em true e a
      // rotação pararia pra sempre no 1º toque. Dentro da janela de toque
      // (8s) esses eventos são ignorados — a pausa do toque já cobre o caso;
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
        className={`flex ${
          reduzido || semTransicao ? "" : "transition-transform duration-500 ease-out"
        }`}
        style={{ transform: `translateX(-${pos * 100}%)`, height: "var(--eh)" }}
        onTransitionEnd={(e) => {
          if (e.target !== e.currentTarget || e.propertyName !== "transform") return
          snap(pos)
        }}
      >
        {ext.map((b, j) => {
          // r = índice REAL do painel (clones apontam pro equivalente)
          const r = temLoop ? (((j - 1) % n) + n) % n : j
          const clone = temLoop && (j === 0 || j === n + 1)
          const ativo = j === pos
          // ativo + vizinhos carregam eager (o próximo fica pronto nos 6s de
          // folga); o resto lazy — senão o carrossel baixa as 10 artes de vez.
          // Clones repetem a URL do real → o browser reusa do cache.
          const vizinho = j === pos - 1 || j === pos + 1
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
              {...(prioridade && !clone && r === 0
                ? { priority: true }
                : { loading: (ativo || vizinho ? "eager" : "lazy") as "eager" | "lazy" })}
            />
          )
          return (
            <div
              key={j}
              role="group"
              aria-roledescription="painel"
              aria-label={`Painel ${r + 1} de ${n}`}
              aria-hidden={!ativo || clone}
              className="flex h-full w-full shrink-0 items-center justify-center"
            >
              {b.link ? (
                <a
                  href={b.link}
                  className="block h-full"
                  aria-label="Ver oferta"
                  tabIndex={ativo && !clone ? 0 : -1}
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

      {/* setas (alvo ≥44px): mobile sempre visível e discreta; desktop só no
          hover/foco do carrossel (md:opacity-0 + group-hover/focus-within) */}
      {temLoop && (
        <>
          <button
            type="button"
            onClick={() => passo(-1)}
            aria-label="Painel anterior"
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/75 pb-1 text-2xl font-bold leading-none text-copamar-primary shadow-md ring-1 ring-black/10 transition hover:bg-white md:h-12 md:w-12 md:bg-white/90 md:text-3xl md:opacity-0 md:focus-visible:opacity-100 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => passo(1)}
            aria-label="Próximo painel"
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/75 pb-1 text-2xl font-bold leading-none text-copamar-primary shadow-md ring-1 ring-black/10 transition hover:bg-white md:h-12 md:w-12 md:bg-white/90 md:text-3xl md:opacity-0 md:focus-visible:opacity-100 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
          >
            ›
          </button>

          {/* pontinhos: área de toque 28×44px por ponto (10 pontos cabem no 375px);
              a faixa full-width é pointer-events-none pra não roubar o clique do
              link do banner — só os botões recebem toque */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center">
            {bs.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => irPara(i)}
                aria-label={`Ir para o painel ${i + 1}`}
                aria-current={i === idxReal ? "true" : undefined}
                className="pointer-events-auto flex h-11 w-7 items-center justify-center"
              >
                <span
                  className={`block rounded-full ring-1 ring-black/25 transition-all ${
                    i === idxReal ? "h-3.5 w-3.5 bg-copamar-primary" : "h-2.5 w-2.5 bg-white/95"
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
