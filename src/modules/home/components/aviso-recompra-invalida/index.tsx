"use client"

import { useSearchParams } from "next/navigation"
import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Aviso DISCRETO na home quando um link de recompra não valida
 * (?recompra=invalido — a rota /recompra/[token] redireciona pra cá). Sem
 * alarme, sem culpa: só orienta a montar o pedido na loja. Dispensável.
 * Client-side + useSearchParams (Suspense no pai) pra NÃO tirar a home do
 * cache estático.
 */
const AvisoRecompraInvalida = () => {
  const sp = useSearchParams()
  const [fechado, setFechado] = useState(false)

  if (sp?.get("recompra") !== "invalido" || fechado) return null

  return (
    <div className="content-container pt-3">
      <div className="relative rounded-large border border-amber-200 bg-amber-50 px-4 py-3 pr-9 text-sm dark:border-amber-900/40 dark:bg-amber-900/20">
        <p className="text-amber-800 dark:text-amber-200">
          Esse link de recompra não está mais válido — mas relaxa: você pode
          montar seu pedido normalmente{" "}
          <LocalizedClientLink
            href="/store"
            className="font-semibold underline underline-offset-2"
          >
            aqui na loja
          </LocalizedClientLink>
          .
        </p>
        <button
          type="button"
          aria-label="Fechar aviso"
          onClick={() => setFechado(true)}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-amber-800 hover:bg-amber-100 dark:text-amber-200"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default AvisoRecompraInvalida
