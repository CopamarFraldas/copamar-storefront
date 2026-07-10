import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import PrecoAVista from "../preco-a-vista"

// Preço unitário (Manus 10/07): "R$ X,XX /un" facilita comparar custo-benefício
// entre pacotes de contagens diferentes. Mesma regex do feed.xml (unit_pricing).
// Exportada pra os cards do grid/busca reusarem (PreviewPrice) — NÃO duplicar.
export function contagemDoTitulo(titulo?: string | null): number | null {
  const m =
    /(?:c\/|\bcom)\s*(\d{1,4})\s*(?:un\b|unidades?)?/i.exec(titulo || "") ||
    /\((\d{1,4})\s*unidades?\)/i.exec(titulo || "")
  return m ? parseInt(m[1], 10) : null
}

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  const unidades = contagemDoTitulo(product.title)
  const precoUnitario =
    unidades && unidades > 1 && selectedPrice.calculated_price_number
      ? (selectedPrice.calculated_price_number / unidades).toLocaleString("pt-BR", {
          style: "currency",
          currency: selectedPrice.currency_code?.toUpperCase() || "BRL",
        })
      : null

  return (
    <div className="flex flex-col text-ui-fg-base">
      <span
        className={clx("text-3xl sm:text-4xl font-bold leading-tight", {
          "text-ui-fg-interactive": selectedPrice.price_type === "sale",
        })}
      >
        {!variant && (
          <span className="text-base font-normal text-ui-fg-subtle">
            A partir de{" "}
          </span>
        )}
        <span
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {selectedPrice.calculated_price}
        </span>
      </span>
      {precoUnitario && (
        <span className="text-sm text-ui-fg-subtle" data-testid="preco-unitario">
          ≈ <span className="font-semibold">{precoUnitario}</span> por unidade
          <span className="text-ui-fg-muted"> · pacote com {unidades} un</span>
        </span>
      )}
      <PrecoAVista
        amount={selectedPrice.calculated_price_number}
        currency_code={selectedPrice.currency_code}
        full
      />
      {selectedPrice.price_type === "sale" && (
        <>
          <p>
            <span className="text-ui-fg-subtle">Original: </span>
            <span
              className="line-through"
              data-testid="original-product-price"
              data-value={selectedPrice.original_price_number}
            >
              {selectedPrice.original_price}
            </span>
          </p>
          <span className="text-ui-fg-interactive">
            -{selectedPrice.percentage_diff}%
          </span>
        </>
      )}
    </div>
  )
}
