"use client"

import { useEffect } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Error boundary da PDP: segura falhas do backend (ex.: Medusa fora do ar)
// com mensagem amigável em vez do erro cru / overlay de dev.
export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Erro ao carregar a página do produto:", error)
  }, [error])

  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center">
      <h1 className="text-2xl-semi text-ui-fg-base">
        Não conseguimos carregar este produto agora
      </h1>
      <p className="text-small-regular text-ui-fg-base max-w-md">
        Pode ser uma instabilidade momentânea. Tente de novo em alguns
        segundos — se não resolver, volte para a página inicial.
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center justify-center rounded-large bg-copamar-cta px-6 py-3 font-semibold text-[#0a2e6b] transition-colors hover:bg-copamar-cta-dark"
      >
        Tentar de novo
      </button>
      <LocalizedClientLink
        href="/"
        className="font-semibold text-copamar-primary underline"
      >
        Ir para a página inicial
      </LocalizedClientLink>
    </div>
  )
}
