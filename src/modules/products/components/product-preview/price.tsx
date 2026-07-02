import { Text, clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"
import PrecoAVista from "../preco-a-vista"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

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
      <PrecoAVista
        amount={price.calculated_price_number}
        currency_code={price.currency_code}
      />
    </>
  )
}
