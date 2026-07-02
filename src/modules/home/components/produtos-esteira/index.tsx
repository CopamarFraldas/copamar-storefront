"use client"

import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Esteira de MUITOS produtos passando devagar (Marco 09/06). Cada produto é
 * CLICÁVEL e leva direto ao seu PDP (Marco). Modo `transparente`: sobreposta na
 * parte baixa da foto do hero, deixando ver a foto entre os produtos. Loop sem
 * emenda (sequência duplicada + translateX(-50%), cada item com sua margem).
 * Pausa no hover — o que também facilita clicar no item parado.
 */
const PRODUTOS: { handle: string; img: string; nome: string }[] = [
  {"handle":"absorvente-geriatrico-adultcare-c-40-unidades","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7896104605806-0-01KSMWW8FZ81WGBGWEY9YW6B2Y.webp","nome":"Absorvente Geriátrico Adultcare c/ 40 un"},
  {"handle":"fralda-tena-slip-dermacare-grande-c-32","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7896770983383-0-01KSMWWC4RK4YGN982KH3W607Z.webp","nome":"Fralda Tena Slip Dermacare Grande c/ 32 un"},
  {"handle":"absorvente-tena-men-protetor-masculino-noturno-level-3-c-48","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7322540016413-6-0-01KSMWWHYGGPFX68PF1Y7ZA2JR.webp","nome":"Absorvente Tena Men Protetor Masculino Noturno Level 3 c/ 48"},
  {"handle":"lencol-descartavel-abena-abri-soft-com-30-unidades","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/5713571004821-0-01KSMY5CRTGF67TGY7KM3M4CJV.jpg","nome":"Lençol Descartável ABENA Abri-Soft c/ 30 un"},
  {"handle":"fralda-slip-noturna-grande-c-32-unidades","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7896770983406-0-01KSMWW9FMZW6TS1SP3BDKN8AN.webp","nome":"Fralda Slip Noturna Grande c/ 32 un"},
  {"handle":"protetor-de-colchao-gerialife-c-6-unidades","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7896104605059-0-01KSMZR5H9SS7P067EH45B1C3X.webp","nome":"Protetor de Colchão Gerialife c/ 6 un"},
  {"handle":"fralda-slip-noturna-media-c-32-unidades","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7896770983390-0-01KSMWWB4RY00WTTQKD1WVPCDN.webp","nome":"Fralda Slip Noturna Média c/ 32 un"},
  {"handle":"fralda-tena-slip-dermacare-media-c-32","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7896770983376-0-01KSMWWD38MKM6YFFAGG1KVA1S.webp","nome":"Fralda Tena Slip Dermacare Média c/ 32 un"},
  {"handle":"roupa-intima-tena-pants-mulher-nude-g-eg-c-16","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7896770983338-0-01KSMWWE1SNRYAW21GHVMT28JQ.webp","nome":"Roupa Íntima Tena Pants Mulher Nude G/EG c/ 16 un"},
  {"handle":"calcinha-descartavel-roupa-intima-tena-pants-mulher-p-m-c-16","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7896770983321-0-01KSMWWEZZHGKRZ8C54K3AKCK2.webp","nome":"Calcinha Descartável Roupa Íntima Tena Pants Mulher P/M c/ 1"},
  {"handle":"tena-men-level-2-active-fit-c-60-unidades","img":"/produtos/tena-men-lv2-fardo-6cx.webp","nome":"Tena Men Level 2 Active Fit c/ 60 un"},
  {"handle":"roupa-intima-plena-g-eg-c-14","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7898204640015-0-01KSMWWGY8T705MY5GSVZVJ2DN.webp","nome":"Roupa Íntima Plena G/EG c/ 14 un"},
  {"handle":"roupa-intima-plena-p-m-c-14","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7898204640008-0-01KSMWWK35P2A5HJGBQ5SMNKXC.webp","nome":"Roupa Íntima Plena P/M c/ 14 un"},
  {"handle":"absorvente-abena-light-extra-3-c-10-unidades","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/5713571001226-0-01KSMWWM7BX34SCNWW6YTW9QKR.webp","nome":"Absorvente Abena Light Extra 3 c/ 10 un"},
  {"handle":"roupa-intima-plena-xxg-c-12","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7898204640046-0-01KSMWWNEEMPM5EGDDNFR872AP.webp","nome":"Roupa Íntima Plena XXG c/ 12 un"},
  {"handle":"lencol-descartavel-adultcare-medio-com-6","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7896104605189-0-01KSMWWPD60RZMHJGJ39S9S2KW.jpg","nome":"Lençol Descartável Adultcare Médio com 6"},
  {"handle":"max-care-pants-p-m-c-28","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7898039561486-0-01KSMWWQCHAK95053NJDEGPZC1.webp","nome":"Max Care Pants P/M c/ 28 un"},
  {"handle":"absorvente-feminino-abena-abri-light-super-30-unidades","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/5713571001264-0-01KSMWWRBAQB10G665KZN15JX1.webp","nome":"Absorvente Feminino ABENA Abri-Light SUPER c/ 30 un"},
  {"handle":"absorvente-masculino-abena-man-formula-2-c-15","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/5713571001141-0-01KSMWWS977E2GKDQW2KYV2JDV.webp","nome":"Absorvente Masculino Abena Man Formula 2 c/ 15 un"},
  {"handle":"tena-slip-dermacare-eg-c-24-unidades","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7896770983666-0-01KSMWWT84AK31T9R29VDF1TEA.webp","nome":"Tena Slip Dermacare EG c/ 24 un"},
  {"handle":"tena-pants-confort-c-16-p-m","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7896770979331-0-01KSMWWV73X4REZC6VZPC6JX42.webp","nome":"Tena Pants Confort c/ 16 un P/M"},
  {"handle":"absorvente-comfort-life-c-20","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/07898902458707-0-01KSMWWW8HG5839PC6V1DD9ZFG.jpg","nome":"Absorvente Comfort Life c/ 20 un"},
  {"handle":"fralda-geriatrica-noturna-vitalidade-sxg-c-24","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7898773230044-0-01KSMY5GZTQZ90TPY5SCA28SX2.jpg","nome":"Fralda Geriátrica Noturna Vitalidade SXG c/ 24 un"},
  {"handle":"fralda-geriatrica-noturna-vitalidade-p-c-30","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/0630941686331-0-01KSMY5HS416N8N8396BWDCR5W.jpg","nome":"Fralda Geriátrica Noturna Vitalidade P c/ 30 un"},
  {"handle":"fralda-geriatrica-noturna-vitalidade-eg-c-26","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7898773230037-0-01KSMWWX7KNHWD2ST3H3KKVN0S.webp","nome":"Fralda Geriátrica Noturna Vitalidade EG c/ 26 un"},
  {"handle":"fralda-geriatrica-noturna-vitalidade-m-c-30","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7898773230013-0-01KSMWWY6J0WC5KDVZ8V8HZYJZ.webp","nome":"Fralda Geriátrica Noturna Vitalidade M c/ 30 un"},
  {"handle":"fralda-geriatrica-noturna-vitalidade-g-c-30","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7898773230020-0-01KSMWWZ52N1BV02E25P16ART4.webp","nome":"Fralda Geriátrica Noturna Vitalidade G c/ 30 un"},
  {"handle":"toalha-tena-dermacare-c-40","img":"/produtos/tena/toalha-dermacare/g01.png","nome":"Toalha Tena Dermacare c/ 40 un"},
  {"handle":"luva-de-procedimento-vinil-s-po-p","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7898283814390-0-01KSMY5JN1FTJYNY32JGXD56S0.jpg","nome":"Luva de Procedimento Vinil Sem Pó P"},
  {"handle":"luva-nitrilica-s-po-preta-media","img":"https://pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev/7898283816387-0-01KSMY5KF8YQ785K0R6A7XPNBW.jpg","nome":"Luva Nitrílica s/ Pó Preta Média"},
]

export default function ProdutosEsteira({
  altura = 66,
  duracao = 70,
  transparente = false,
}: {
  altura?: number
  duracao?: number
  transparente?: boolean
}) {
  const seq = [...PRODUTOS, ...PRODUTOS]
  const wrap = transparente
    ? "prod-wrap relative w-full overflow-hidden"
    : "prod-wrap relative w-full overflow-hidden rounded-large border border-ui-border-base bg-white/70 py-2 dark:bg-ui-bg-base/60"
  return (
    <div className={wrap}>
      <span className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-8 ${transparente ? "bg-gradient-to-r from-black/30 to-transparent" : "bg-gradient-to-r from-copamar-bg-light to-transparent dark:from-ui-bg-subtle"}`} />
      <span className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-8 ${transparente ? "bg-gradient-to-l from-black/30 to-transparent" : "bg-gradient-to-l from-copamar-bg-light to-transparent dark:from-ui-bg-subtle"}`} />
      <style>{`
        @keyframes prod-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .prod-track { animation: prod-scroll ${duracao}s linear infinite; will-change: transform; }
        .prod-wrap:hover .prod-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .prod-track { animation: none; } }
      `}</style>
      <div className="prod-track flex w-max pl-2">
        {seq.map((p, i) => (
          <LocalizedClientLink
            key={i}
            href={`/products/${p.handle}`}
            aria-label={p.nome}
            title={p.nome}
            className="shrink-0 transition-transform hover:scale-105"
            style={{ marginRight: 8 }}
          >
            {/* next/image #101: o slot é um quadrado fixo de {altura}px, mas as
                fontes são as fotos CHEIAS do R2 (tinha até 379KB) — o optimizer
                serve o thumb em AVIF/WebP no tamanho certo, com lazy-load. */}
            <Image
              src={p.img}
              alt={p.nome}
              width={altura}
              height={altura}
              draggable={false}
              className="rounded-rounded bg-white object-contain p-1 shadow-md ring-1 ring-black/5"
              style={{ height: altura, width: altura }}
            />
          </LocalizedClientLink>
        ))}
      </div>
    </div>
  )
}
