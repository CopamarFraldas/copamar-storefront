"use client"

import { updateLineItem } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

type ItemMobileProps = {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
  /** saldo disponível da variant (#46 anti-oversell) — undefined = desconhecido */
  disponivel?: number
}

/**
 * Card de item do carrinho pro MOBILE (Marco, 04/06): a tabela do desktop
 * espremia o nome numa coluna estreita (1 palavra por linha) e a foto ficava
 * com 48px. Aqui: foto MAIOR (96px) à esquerda, nome em largura legível,
 * variação curta embaixo, e linha de quantidade + total clara.
 */
const ItemMobile = ({ item, currencyCode, disponivel }: ItemMobileProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)
    await updateLineItem({ lineId: item.id, quantity })
      .catch((err) => setError(err.message))
      .finally(() => setUpdating(false))
  }

  // cap pelo SALDO REAL (#46 anti-oversell); nunca abaixo da quantity atual
  // (pra dar pra REDUZIR)
  const capSaldo =
    item.variant?.manage_inventory && !item.variant?.allow_backorder && disponivel != null
      ? Math.min(10, Math.max(0, disponivel))
      : 10
  const maxQuantity = Math.max(item.quantity, capSaldo)
  const acimaDoSaldo = disponivel != null && item.quantity > Math.max(0, disponivel)

  return (
    <li
      className="flex gap-x-4 border-b border-ui-border-base py-4 last:border-b-0"
      data-testid="product-row-mobile"
    >
      {/* foto maior, clicável */}
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        className="w-24 shrink-0"
      >
        <Thumbnail
          thumbnail={item.thumbnail}
          images={item.variant?.product?.images}
          title={item.product_title}
          size="square"
        />
      </LocalizedClientLink>

      {/* conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <LocalizedClientLink href={`/products/${item.product_handle}`}>
          <p
            className="text-sm font-medium leading-snug text-ui-fg-base"
            data-testid="product-title"
          >
            {item.product_title}
          </p>
        </LocalizedClientLink>
        <LineItemOptions
          variant={item.variant}
          productTitle={item.product_title}
          data-testid="product-variant"
        />

        {/* quantidade + remover  ·  preço */}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex items-center gap-x-2">
            <CartItemSelect
              value={item.quantity}
              onChange={(value) => changeQuantity(parseInt(value.target.value))}
              className="h-9 w-14 p-2"
              data-testid="product-select-button"
            >
              {Array.from({ length: maxQuantity }, (_, i) => (
                <option value={i + 1} key={i}>
                  {i + 1}
                </option>
              ))}
            </CartItemSelect>
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            {updating && <Spinner />}
          </div>
          {acimaDoSaldo && (
            <span className="text-xs text-rose-500" data-testid="stock-warning">
              Só {Math.max(0, disponivel!)} em estoque
            </span>
          )}
          <div className="flex flex-col items-end">
            {/* unitário inline (LineItemUnitPrice é um bloco <div> — dentro de
                <span> quebrava o "cada" pra linha de baixo; revisão 04/06) */}
            {item.quantity > 1 && (
              <span className="text-xs text-ui-fg-subtle">
                {convertToLocale({
                  amount: (item.total ?? 0) / item.quantity,
                  currency_code: currencyCode,
                })}{" "}
                cada
              </span>
            )}
            <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
          </div>
        </div>
        <ErrorMessage error={error} data-testid="product-error-message" />
      </div>
    </li>
  )
}

export default ItemMobile
