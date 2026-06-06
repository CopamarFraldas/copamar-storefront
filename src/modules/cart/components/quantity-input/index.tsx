"use client"

import { useEffect, useState } from "react"

/**
 * Quantidade LIVRE no carrinho (Marco, 06/06): substitui o <select> 1..10 do
 * starter. Digite qualquer número ou use −/+; sempre respeita o estoque real
 * (clamp em `max`). Aplica no blur/Enter (evita um update por tecla).
 */
export default function QuantityInput({
  value,
  max,
  onChange,
  disabled,
  "data-testid": dataTestId,
}: {
  value: number
  /** estoque disponível; undefined = sem teto conhecido (999) */
  max?: number
  onChange: (q: number) => void
  disabled?: boolean
  "data-testid"?: string
}) {
  const teto = Math.max(1, max ?? 999)
  const [texto, setTexto] = useState(String(value))
  useEffect(() => setTexto(String(value)), [value])

  const aplicar = (raw: string | number) => {
    const n = Math.floor(Number(raw))
    if (!Number.isFinite(n) || n < 1) {
      setTexto(String(value))
      return
    }
    const clamped = Math.min(teto, n)
    setTexto(String(clamped))
    if (clamped !== value) onChange(clamped)
  }

  const botao =
    "flex h-9 w-8 items-center justify-center rounded-md border border-ui-border-base bg-ui-bg-subtle text-base leading-none text-ui-fg-base transition hover:border-copamar-primary/60 disabled:opacity-40"

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        className={botao}
        disabled={disabled || value <= 1}
        onClick={() => aplicar(value - 1)}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label="Quantidade"
        className="h-9 w-14 rounded-md border border-ui-border-base bg-ui-bg-base text-center text-base small:text-sm text-ui-fg-base outline-none focus:border-copamar-primary"
        value={texto}
        disabled={disabled}
        onChange={(e) => setTexto(e.target.value.replace(/\D/g, ""))}
        onBlur={() => aplicar(texto)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur()
        }}
        data-testid={dataTestId}
      />
      <button
        type="button"
        aria-label="Aumentar quantidade"
        className={botao}
        disabled={disabled || value >= teto}
        onClick={() => aplicar(value + 1)}
      >
        +
      </button>
    </span>
  )
}
