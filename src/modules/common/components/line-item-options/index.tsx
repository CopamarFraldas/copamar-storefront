import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

type LineItemOptionsProps = {
  variant: HttpTypes.StoreProductVariant | undefined
  /** Título do produto — quando passado, encurta a variação removendo a parte
   *  repetida (ex.: "Calcinha ... Tena Pants Mulher P/M c/16" → "c/16"). */
  productTitle?: string | null
  "data-testid"?: string
  "data-value"?: HttpTypes.StoreProductVariant
}

/** Valores de opção placeholder que não dizem nada pro cliente. */
const GENERICOS = new Set(["único", "unico", "default", "padrão", "padrao", "default variant"])

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // sem acento
    .replace(/[^a-z0-9]+/g, " ")
    .trim()

/**
 * Rótulo CURTO da variação (Marco, ajuste mobile 04/06): o variant.title do
 * catálogo repete o nome inteiro do produto — no carrinho isso virava 2 linhas
 * de texto redundante. Estratégia:
 *  1. opções reais (M, G, 20 unidades...) → mostra os valores;
 *  2. senão, diff de palavras variant.title × productTitle → mostra só a sobra;
 *  3. nada útil sobrando → NÃO renderiza (não repetir o nome é o melhor rótulo).
 */
function shortLabel(
  variant: HttpTypes.StoreProductVariant | undefined,
  productTitle?: string | null
): string | null {
  if (!variant) return null

  // 1) valores de opção reais (filtra placeholders tipo "Único")
  const optionValues = (variant.options ?? [])
    .map((o) => (o.value ?? "").trim())
    .filter((v) => v && !GENERICOS.has(v.toLowerCase()))
  if (optionValues.length) return optionValues.join(" · ")

  const title = (variant.title ?? "").trim()
  if (!title) return null
  if (!productTitle) return title // sem referência → comportamento antigo (título cru)

  // 2) remove o prefixo comum palavra-a-palavra (normalizado: caixa/acentos/pontuação)
  const tWords = title.split(/\s+/)
  const pWords = norm(productTitle).split(" ")
  let i = 0
  while (i < tWords.length && i < pWords.length && norm(tWords[i]) === pWords[i]) i++
  const sobra = tWords.slice(i).join(" ").replace(/^[\s\-–—·,:/]+/, "").trim()

  // 3) título ≈ nome do produto (sobra vazia ou ínfima) → nada a mostrar
  if (!sobra || norm(sobra).length < 2) return null
  return sobra
}

const LineItemOptions = ({
  variant,
  productTitle,
  "data-testid": dataTestid,
  "data-value": dataValue,
}: LineItemOptionsProps) => {
  const label = shortLabel(variant, productTitle)
  if (!label) return null
  return (
    <Text
      data-testid={dataTestid}
      data-value={dataValue}
      className="inline-block txt-medium text-ui-fg-subtle w-full overflow-hidden text-ellipsis"
    >
      {label}
    </Text>
  )
}

export default LineItemOptions
