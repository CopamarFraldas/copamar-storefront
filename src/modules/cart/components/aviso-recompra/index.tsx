"use client"

import { useSearchParams } from "next/navigation"
import { useState } from "react"

/**
 * Aviso da recompra ("Comprar de novo") — lê o resultado da server action
 * (?recompra=X&de=Y) e mostra quantos itens do último pedido entraram, deixando
 * claro que o PREÇO é o atual. Se algum não entrou (esgotado/descontinuado),
 * avisa sem alarmar. Dispensável.
 */
const AvisoRecompra = () => {
  const sp = useSearchParams()
  const [fechado, setFechado] = useState(false)
  const add = parseInt(sp?.get("recompra") || "", 10)
  const de = parseInt(sp?.get("de") || "", 10)

  if (!add || Number.isNaN(add) || fechado) return null
  const faltou = Number.isFinite(de) ? de - add : 0

  return (
    <div className="relative mb-4 rounded-large border border-emerald-200 bg-emerald-50 px-4 py-3 pr-9 text-sm dark:border-emerald-900/40 dark:bg-emerald-900/20">
      <p className="font-semibold text-emerald-700 dark:text-emerald-300">
        ✓ {add} {add === 1 ? "item" : "de " + de + " itens"} do seu último pedido{" "}
        {add === 1 ? "adicionado" : "adicionados"} — com o preço de hoje.
      </p>
      {faltou > 0 && (
        <p className="mt-0.5 text-emerald-700/80 dark:text-emerald-300/80">
          {faltou}{" "}
          {faltou === 1
            ? "item não está disponível agora"
            : "itens não estão disponíveis agora"}{" "}
          e ficou de fora.
        </p>
      )}
      <button
        type="button"
        aria-label="Fechar aviso"
        onClick={() => setFechado(true)}
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300"
      >
        ×
      </button>
    </div>
  )
}

export default AvisoRecompra
