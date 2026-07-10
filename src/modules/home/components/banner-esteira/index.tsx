"use client"

/**
 * Esteira infinita de banners + slides da marca (Marco 09/06): pega TODOS os
 * banners do site e emenda num "tapete" único que desliza devagar, sem emenda.
 * A cada 3 banners entra um CARD COPAMAR com a nossa mensagem. Track com a
 * sequência DUPLICADA + translateX(-50%) = loop perfeito.
 *
 * Marco 17/06: os banners agora vêm do ADMIN (/store/banners, via props). Se a
 * prop vier vazia (ou a API falhar), cai no FALLBACK hardcoded abaixo = o que
 * estava no ar antes (cutover-safe).
 */

import Image from "next/image"

import { painelId, trackBanner } from "@lib/tracking/banner-ab"

export type BannerInput = { image_url: string; link?: string }
export type SlideInput = { badge: string; titulo: string; sub: string }

// FALLBACK — usado quando o admin ainda não tem nada salvo (ou a API falha)
const LINKS_FALLBACK: Record<string, string> = {
  "frete_gratis": "/br/store",
  "tena_slip": "/br/search?q=tena+slip",
  "dia_noite_vita": "/br/store?marca=Vita+Plus",
  "promo_mes": "/br/store?tipo=Pants+(roupa+%C3%ADntima)",
  "abena": "/br/store?marca=Abena",
  "vitaplus": "/br/store?marca=Vita+Plus",
  "tena_men": "/br/products/protetor-tena-men-level-3-noturno",
  "2": "/br/search?q=vitalidade",
  "retirar_loja": "",
  "10": "/br/search?q=dermacare"
}

// exportado: o banner-carrossel (variante B do A/B do topo) usa o MESMO fallback
export const BANNERS_FALLBACK: BannerInput[] = [
  "frete_gratis", "tena_slip", "dia_noite_vita", "promo_mes", "abena",
  "vitaplus", "tena_men", "2", "retirar_loja", "10",
].map((n) => ({ image_url: `/banners-esteira/${n}.webp`, link: LINKS_FALLBACK[n] || undefined }))

const MARCA_FALLBACK: SlideInput[] = [
  { badge: "🏭 Direto das fábricas · Atacado e varejo", titulo: "Fraldas geriátricas\ndireto das fábricas", sub: "Cuidado e dignidade pra quem você ama." },
  { badge: "🛡️ Multimarca", titulo: "As marcas que\nvocê confia", sub: "Tena · Abena · Bigfral · Adultcare — num lugar só." },
  { badge: "🚚 Entrega pra todo o Brasil", titulo: "Preço de atacado,\nembalagem discreta", sub: "Para cuidadores e profissionais de saúde." },
]

type Item = { tipo: "banner"; b: BannerInput } | { tipo: "marca"; m: SlideInput }

function montaSequencia(banners: BannerInput[], slides: SlideInput[]): Item[] {
  const seq: Item[] = []
  let mi = 0
  banners.forEach((b, i) => {
    seq.push({ tipo: "banner", b })
    if ((i + 1) % 3 === 0 && slides.length) {
      seq.push({ tipo: "marca", m: slides[mi % slides.length] })
      mi++
    }
  })
  return seq
}

/** Caixas de entrega ao fundo do card da marca (canto inferior direito). */
function CaixasEntrega() {
  return (
    <svg
      viewBox="0 0 200 150"
      className="pointer-events-none absolute bottom-0 right-0 h-[94%] w-auto"
      stroke="#8a6532"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <g>
        <polygon points="92,52 132,40 172,52 132,64" fill="#f0cd9a" />
        <rect x="92" y="52" width="40" height="60" fill="#dcb277" />
        <rect x="132" y="52" width="40" height="60" fill="#c79a5d" />
        <rect x="128" y="40" width="9" height="72" fill="#a87f4a" stroke="none" />
      </g>
      <g>
        <rect x="56" y="86" width="36" height="52" fill="#e9c285" />
        <rect x="92" y="86" width="36" height="52" fill="#d3a866" />
        <polygon points="56,86 74,79 92,86 74,93" fill="#f5dcad" />
        <polygon points="92,86 110,79 128,86 110,93" fill="#f5dcad" />
        <rect x="88" y="86" width="8" height="52" fill="#a87f4a" stroke="none" />
      </g>
      <g>
        <polygon points="118,30 142,23 166,30 142,37" fill="#f5dcad" />
        <rect x="118" y="30" width="24" height="22" fill="#e9c285" />
        <rect x="142" y="30" width="24" height="22" fill="#d3a866" />
      </g>
    </svg>
  )
}

export default function BannerEsteira({
  altura = 240,
  alturaMobile,
  duracao = 90,
  prioridade = false,
  banners,
  marcaSlides,
  varianteAB,
}: {
  altura?: number
  /** altura menor no mobile (banner no TOPO não pode engolir a 1ª dobra do celular) */
  alturaMobile?: number
  duracao?: number
  /** true quando a esteira é o 1º elemento da página (carrega a 1ª imagem com priority p/ LCP) */
  prioridade?: boolean
  banners?: BannerInput[]
  marcaSlides?: SlideInput[]
  /** setado pelo A/B do topo (banner-topo-ab): liga o banner_click com a variante; sem ele, zero tracking (comportamento antigo) */
  varianteAB?: "esteira"
}) {
  const bs = banners && banners.length ? banners : BANNERS_FALLBACK
  const ms = marcaSlides && marcaSlides.length ? marcaSlides : MARCA_FALLBACK
  const base = montaSequencia(bs, ms)
  const seq = [...base, ...base] // duplicado p/ loop sem emenda
  const hMobile = alturaMobile ?? altura

  return (
    <div
      className="esteira-wrap relative w-full overflow-hidden bg-copamar-bg-light dark:bg-ui-bg-subtle"
      aria-label="Ofertas e diferenciais Copamar"
    >
      <style>{`
        @keyframes esteira-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .esteira-wrap { --eh: ${hMobile}px }
        @media (min-width: 768px) { .esteira-wrap { --eh: ${altura}px } }
        .esteira-track { animation: esteira-scroll ${duracao}s linear infinite; will-change: transform; }
        .esteira-wrap:hover .esteira-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .esteira-track { animation: none; } }
      `}</style>
      <div className="esteira-track flex w-max">
        {seq.map((it, i) =>
          it.tipo === "banner" ? (
            it.b.link ? (
              <a
                key={i}
                href={it.b.link}
                className="block shrink-0"
                aria-label="Ver oferta"
                onClick={
                  varianteAB
                    ? () =>
                        trackBanner("banner_click", {
                          variante: varianteAB,
                          painel: painelId(it.b),
                        })
                    : undefined
                }
              >
                {/* next/image #101: width/height 0 + width:auto porque cada banner
                    tem proporção própria (e os do admin são upload livre) — mesmo
                    layout do <img> cru de antes (sem CLS novo), mas com lazy-load
                    e AVIF/WebP redimensionado. sizes ≈ maior largura renderizada
                    (aspecto ~3,2 × altura 200-240). */}
                <Image src={it.b.image_url} alt="" width={0} height={0} sizes="(max-width: 767px) 460px, 680px" quality={70} priority={prioridade && i === 0} draggable={false} className="block w-auto select-none" style={{ height: "var(--eh)", width: "auto" }} />
              </a>
            ) : (
              <Image
                key={i}
                src={it.b.image_url}
                alt=""
                width={0}
                height={0}
                sizes="(max-width: 767px) 460px, 680px" quality={70}
                priority={prioridade && i === 0}
                aria-hidden="true"
                draggable={false}
                className="block w-auto shrink-0 select-none"
                style={{ height: "var(--eh)", width: "auto" }}
              />
            )
          ) : (
            <div
              key={i}
              className="relative flex shrink-0 flex-col justify-center overflow-hidden bg-gradient-to-br from-copamar-primary to-[#0c3576] px-7 text-white"
              style={{ height: "var(--eh)", width: "calc(var(--eh) * 1.45)" }}
              aria-hidden="true"
            >
              <CaixasEntrega />
              <span className="absolute inset-0 bg-gradient-to-r from-copamar-primary from-10% via-copamar-primary via-[46%] to-transparent" />
              <span className="absolute inset-x-0 bottom-0 z-10 h-1.5 bg-copamar-cta" />
              <span className="relative z-10 mb-1.5 inline-flex w-fit items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                {it.m.badge}
              </span>
              <h2 className="relative z-10 whitespace-pre-line text-[1.15rem] font-bold leading-[1.12]">
                {it.m.titulo}
              </h2>
              <p className="relative z-10 mt-1 text-xs text-white/85">{it.m.sub}</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
