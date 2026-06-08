"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Nivel } from "./resolver"

/**
 * Régua de gotas (SVG inline) — o "medidor de absorção" do Hero.
 * 5 gotas: Leve · Moderado · Forte · Intenso · Noturno. Começam cinza e
 * acendem de baixo pra cima (vertical) / da esquerda pra direita (mobile),
 * uma a uma. A gota ATIVA é âmbar e pulsa devagar; as abaixo dela ficam
 * azuis. Navegável por teclado (setas trocam o nível). Reduced-motion:
 * acende instantâneo, sem pulso/stagger.
 */

const CINZA = "#cdd8ec" // cinza-azulado (combina com a paleta Copamar)
const AZUL = "#1251b8"
const AMBAR = "#ef7e1a"

function Gota({
  aceso,
  ativo,
  reduzir,
  delay,
}: {
  aceso: boolean
  ativo: boolean
  reduzir: boolean
  delay: number
}) {
  const cor = ativo ? AMBAR : aceso ? AZUL : CINZA
  return (
    <motion.svg
      viewBox="0 0 24 30"
      width="26"
      height="32"
      aria-hidden
      initial={false}
      animate={
        ativo && !reduzir
          ? { scale: [1, 1.06, 1] }
          : { scale: 1 }
      }
      transition={
        ativo && !reduzir
          ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0 }
      }
    >
      {/* gota: ponta em cima, bojo embaixo */}
      <motion.path
        d="M12 1 C12 1 3 12 3 19 a9 9 0 0 0 18 0 C21 12 12 1 12 1 Z"
        initial={false}
        animate={{ fill: cor }}
        transition={{ duration: reduzir ? 0 : 0.35, delay: reduzir ? 0 : delay }}
        stroke={ativo ? AMBAR : "transparent"}
        strokeWidth="1.5"
      />
      {/* brilho interno quando aceso */}
      {aceso && (
        <ellipse cx="9" cy="17" rx="2" ry="3" fill="#ffffff" opacity="0.35" />
      )}
    </motion.svg>
  )
}

export default function ReguaGotas({
  niveis,
  ativoIndex,
  onSelect,
  orientacao = "vertical",
}: {
  niveis: Nivel[]
  /** índice 0..4 do nível atual; null = nada aceso ainda */
  ativoIndex: number | null
  onSelect: (index: number) => void
  orientacao?: "vertical" | "horizontal"
}) {
  const reduzir = !!useReducedMotion()
  const vertical = orientacao === "vertical"
  // vertical: leve embaixo → noturno em cima (acende de baixo p/ cima).
  // horizontal: leve à esquerda → noturno à direita.
  const ordemVisual = vertical ? [...niveis].reverse() : niveis

  const onKey = (e: React.KeyboardEvent, idxReal: number) => {
    const proximo = vertical
      ? e.key === "ArrowUp"
        ? idxReal + 1
        : e.key === "ArrowDown"
        ? idxReal - 1
        : null
      : e.key === "ArrowRight"
      ? idxReal + 1
      : e.key === "ArrowLeft"
      ? idxReal - 1
      : null
    if (proximo == null) return
    e.preventDefault()
    const alvo = Math.max(0, Math.min(niveis.length - 1, proximo))
    onSelect(alvo)
  }

  return (
    <div
      role="group"
      aria-label="Régua de absorção — do leve ao noturno"
      className={
        vertical
          ? "flex flex-col items-center gap-2"
          : "flex flex-row items-center justify-center gap-2"
      }
    >
      {ordemVisual.map((nivel) => {
        const idxReal = niveis.findIndex((n) => n.chave === nivel.chave)
        const aceso = ativoIndex != null && idxReal <= ativoIndex
        const ativo = ativoIndex === idxReal
        // stagger de baixo p/ cima: quanto menor o índice, mais cedo acende
        const delay = ativoIndex != null ? idxReal * 0.06 : 0
        return (
          <button
            key={nivel.chave}
            type="button"
            onClick={() => onSelect(idxReal)}
            onKeyDown={(e) => onKey(e, idxReal)}
            aria-label={nivel.aria}
            aria-pressed={ativo}
            title={nivel.rotulo}
            className="group flex items-center gap-2 rounded-lg px-1.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-copamar-cta/70"
          >
            <Gota aceso={aceso} ativo={ativo} reduzir={reduzir} delay={delay} />
            <span
              className={`text-[11px] font-medium tabular-nums transition-colors ${
                ativo
                  ? "text-copamar-cta"
                  : aceso
                  ? "text-copamar-primary"
                  : "text-ui-fg-muted"
              } ${vertical ? "min-w-[64px] text-left" : "hidden xsmall:inline"}`}
            >
              {nivel.rotulo}
            </span>
          </button>
        )
      })}
    </div>
  )
}
