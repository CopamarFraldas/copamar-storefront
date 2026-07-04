"use client"

import dynamic from "next/dynamic"

/**
 * 04/07 (2º passe LCP/TBT): wrapper que carrega o FreteCep (Client Component com
 * useEffect/localStorage/fetch) como chunk assíncrono, tirando o JS dele do
 * bundle inicial da home. ssr:false porque é uma calculadora 100% do cliente,
 * sem valor de SEO (nenhum texto indexável a preservar), e depende de
 * localStorage no mount. O skeleton replica a caixa "compact" (mesma borda/bg +
 * altura mínima) pra não deslocar o GuiaEscolha ao lado/abaixo quando montar.
 * Usado SÓ na home — a PDP continua importando o FreteCep direto (ouvirPdp).
 * page.tsx é Server Component, daí este wrapper "use client".
 */
const FreteCep = dynamic(() => import("./index"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      className="flex h-full min-h-[150px] flex-col rounded-large border border-ui-border-base bg-ui-bg-subtle p-5"
    >
      <div className="flex items-center gap-x-2">
        <span aria-hidden>🚚</span>
        <span className="text-sm font-semibold text-ui-fg-base">
          Calcular frete e prazo
        </span>
      </div>
      <div className="mt-3 h-10 w-full max-w-[240px] rounded-lg bg-ui-bg-base" />
    </div>
  ),
})

export default function FreteCepLazy(props: {
  variantId?: string
  compact?: boolean
  ouvirPdp?: boolean
}) {
  return <FreteCep {...props} />
}
