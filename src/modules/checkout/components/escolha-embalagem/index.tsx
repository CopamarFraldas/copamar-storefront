"use client"

import { useState, useTransition } from "react"
import { setEmbalagem } from "@lib/data/cart"

/**
 * Escolha de embalagem no checkout (Marco 08/06), logo após o frete:
 * DISCRETA (padrão — caixa neutra, ninguém sabe o que é) ou TRANSPARENTE,
 * ambas R$ 0,00 de acréscimo. A escolha vai pras observações do pedido no Bling.
 */
type Opcao = "discreta" | "transparente"

const OPCOES: { valor: Opcao; titulo: string; desc: string }[] = [
  {
    valor: "discreta",
    titulo: "Embalagem discreta",
    desc: "Caixa neutra, sem indicar o conteúdo. Ninguém percebe o que é.",
  },
  {
    valor: "transparente",
    titulo: "Embalagem transparente",
    desc: "Embalagem comum, sem caixa neutra por fora.",
  },
]

export default function EscolhaEmbalagem({
  inicial,
}: {
  inicial?: string | null
}) {
  const [valor, setValor] = useState<Opcao>(
    inicial === "transparente" ? "transparente" : "discreta"
  )
  const [pending, startTransition] = useTransition()

  const escolher = (v: Opcao) => {
    setValor(v)
    startTransition(() => {
      setEmbalagem(v).catch(() => {})
    })
  }

  return (
    <div className="mb-6 mt-2" data-testid="escolha-embalagem">
      <span className="font-medium txt-medium text-ui-fg-base">Embalagem</span>
      <span className="mb-3 block text-ui-fg-subtle txt-medium">
        Como você prefere receber — sem custo nenhum
      </span>
      <div className="grid grid-cols-1 gap-2 small:grid-cols-2">
        {OPCOES.map((op) => {
          const ativo = valor === op.valor
          return (
            <button
              key={op.valor}
              type="button"
              onClick={() => escolher(op.valor)}
              aria-pressed={ativo}
              data-testid={`embalagem-${op.valor}`}
              className={`flex flex-col items-start rounded-rounded border px-4 py-3 text-left transition-colors ${
                ativo
                  ? "border-ui-border-interactive shadow-borders-interactive-with-active"
                  : "border-ui-border-base hover:shadow-borders-interactive-with-active"
              }`}
            >
              <span className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2 text-base-regular text-ui-fg-base">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      ativo ? "border-ui-fg-interactive" : "border-ui-border-base"
                    }`}
                  >
                    {ativo && <span className="h-2 w-2 rounded-full bg-ui-fg-interactive" />}
                  </span>
                  {op.titulo}
                </span>
                <span className="text-emerald-600 font-medium text-small-regular">
                  R$ 0,00
                </span>
              </span>
              <span className="mt-1 pl-6 text-small-regular text-ui-fg-subtle">
                {op.desc}
              </span>
            </button>
          )
        })}
      </div>
      {pending && (
        <span className="mt-1 block text-xsmall-regular text-ui-fg-muted">
          salvando…
        </span>
      )}
    </div>
  )
}
