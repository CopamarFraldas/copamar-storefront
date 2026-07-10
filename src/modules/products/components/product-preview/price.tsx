import { Text, clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"
import { contagemDoTitulo } from "../product-price"
import PrecoAVista from "../preco-a-vista"

export default async function PreviewPrice({
  price,
  productTitle,
}: {
  price: VariantPrice
  /** título do produto — usado pra extrair a contagem ("c/ 8 un") e mostrar
   *  o preço por unidade no card, igual à PDP. Sem contagem → sem linha. */
  productTitle?: string | null
}) {
  if (!price) {
    return null
  }

  // preço unitário no card (mesma regra da PDP): só quando a contagem é
  // extraível do título — urgência de comparação FACTUAL, nunca chute
  const unidades = contagemDoTitulo(productTitle)
  const precoUnitario =
    unidades && unidades > 1 && price.calculated_price_number
      ? (price.calculated_price_number / unidades).toLocaleString("pt-BR", {
          style: "currency",
          currency: price.currency_code?.toUpperCase() || "BRL",
        })
      : null

  return (
    <>
      {price.price_type === "sale" && (
        <Text
          className="line-through text-ui-fg-muted text-xs"
          data-testid="original-price"
        >
          {price.original_price}
        </Text>
      )}
      <Text
        className={clx("text-xl small:text-2xl medium:text-3xl font-semibold leading-tight text-ui-fg-subtle", {
          "text-ui-fg-interactive": price.price_type === "sale",
        })}
        data-testid="price"
      >
        {price.calculated_price}
      </Text>
      {precoUnitario && (
        <span
          className="text-xs text-ui-fg-subtle leading-snug"
          data-testid="preco-unitario-card"
        >
          ≈ {precoUnitario} por unidade
        </span>
      )}
      <PrecoAVista
        amount={price.calculated_price_number}
        currency_code={price.currency_code}
      />
    </>
  )
}
