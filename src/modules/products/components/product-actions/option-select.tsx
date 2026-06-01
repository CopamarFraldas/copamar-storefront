import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)

  // Tradução leve dos títulos comuns do seed inglês (Size/Color). Produtos
  // reais Copamar já virão com title em PT — o fallback usa o título original.
  const titlePt: Record<string, string> = {
    Size: "Tamanho",
    Color: "Cor",
    Material: "Material",
  }
  const titleLabel = titlePt[title] ?? title

  return (
    <div className="flex flex-col gap-y-2">
      <span className="text-sm font-medium text-ui-fg-base">
        Escolha o {titleLabel.toLowerCase()}:
      </span>
      <div className="flex flex-wrap gap-2" data-testid={dataTestId}>
        {filteredOptions.map((v) => {
          const selecionado = v === current
          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              aria-pressed={selecionado}
              className={clx(
                "h-11 min-w-[3.25rem] flex-1 rounded-lg border px-3 text-sm transition",
                {
                  // selecionado: preenchido + borda forte (claro pra olhos +velhos)
                  "border-copamar-primary bg-copamar-primary/10 font-semibold text-copamar-primary ring-1 ring-copamar-primary":
                    selecionado,
                  "border-ui-border-base bg-ui-bg-subtle text-ui-fg-base hover:border-copamar-primary/60":
                    !selecionado,
                }
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
