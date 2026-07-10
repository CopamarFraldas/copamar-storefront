"use client"

import { useEffect, useState } from "react"
import {
  CompararItem,
  MAX_COMPARAR,
  lerComparar,
  subscribeComparar,
  toggleComparar,
} from "@lib/util/comparar"

/**
 * Checkbox discreto "⚖ Comparar" no rodapé do card (fica FORA do link do card,
 * então marcar não navega). Estado vem do localStorage via @lib/util/comparar;
 * a barra fixa (CompararBar no layout) aparece sozinha quando há itens.
 * Hydration-safe: primeiro render sempre desmarcado (servidor não conhece o
 * localStorage) e o useEffect sincroniza logo no mount.
 */
export default function CompararCheckbox({
  handle,
  title,
  thumbnail,
}: CompararItem) {
  const [sel, setSel] = useState(false)
  const [cheio, setCheio] = useState(false)

  useEffect(() => {
    const sync = () => {
      const itens = lerComparar()
      setSel(itens.some((i) => i.handle === handle))
      setCheio(itens.length >= MAX_COMPARAR)
    }
    sync()
    return subscribeComparar(sync)
  }, [handle])

  const bloqueado = cheio && !sel

  return (
    <label
      className={
        "mt-2 flex w-fit cursor-pointer select-none items-center gap-x-1.5 text-xs text-ui-fg-subtle transition-colors hover:text-ui-fg-base " +
        (bloqueado ? "cursor-not-allowed opacity-50" : "")
      }
      title={
        bloqueado
          ? `Você pode comparar até ${MAX_COMPARAR} produtos`
          : undefined
      }
      // o card inteiro vive perto de links — garante que marcar nunca navega
      onClick={(e) => e.stopPropagation()}
      data-testid="comparar-checkbox"
    >
      <input
        type="checkbox"
        checked={sel}
        disabled={bloqueado}
        onChange={() => toggleComparar({ handle, title, thumbnail })}
        className="h-4 w-4 rounded border-ui-border-base accent-copamar-primary"
        aria-label={`Comparar ${title}`}
      />
      <span aria-hidden="true">⚖</span>
      <span>Comparar</span>
    </label>
  )
}
