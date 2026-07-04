"use client"

import dynamic from "next/dynamic"

/**
 * 04/07 (2º passe LCP/TBT): a BussolaSection é a ÚNICA coisa da home que puxa
 * framer-motion (~100KB+) e é interativa + fica ABAIXO do hero. Aqui ela vira um
 * chunk assíncrono (dynamic import) fora do bundle inicial da home → tira
 * framer-motion do JS que bloqueia o 1º paint/hidratação (TBT + unused JS).
 *
 * ssr:false é seguro aqui porque:
 *  - o convite é marketing sem valor de SEO — o "Não sabe qual escolher?" já
 *    existe no GuiaEscolha (server-rendered, abaixo), então nada de índice se
 *    perde;
 *  - o quiz depende de estado do cliente (useState/useReducer) e só monta ao
 *    clicar, então não há conteúdo indexável a preservar no HTML inicial.
 * O skeleton reserva altura aproximada do cartão-convite pra não causar CLS
 * quando o chunk resolve (ainda mais leve por estar bem abaixo da dobra).
 * page.tsx é Server Component e não pode usar dynamic({ssr:false}) direto — por
 * isso este wrapper "use client".
 */
const BussolaSection = dynamic(() => import("./bussola-section"), {
  ssr: false,
  loading: () => (
    <div className="content-container py-6" aria-hidden>
      <div className="h-[168px] rounded-large border border-copamar-primary/15 bg-gradient-to-br from-[#eaf1fc] to-white shadow-[0_4px_24px_rgba(18,81,184,0.07)]" />
    </div>
  ),
})

export default function BussolaSectionLazy() {
  return <BussolaSection />
}
