"use client"

import { Table, Text, clx } from "@medusajs/ui"
import { updateLineItem } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import QuantityInput from "@modules/cart/components/quantity-input"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
  /** saldo disponível da variant (#46 anti-oversell) — undefined = desconhecido */
  disponivel?: number
}

const Item = ({ item, type = "full", currencyCode, disponivel }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  // Quantidade LIVRE (Marco 06/06): sem teto artificial — o limite é o saldo
  // real; nunca abaixo da quantity atual (pra dar pra REDUZIR).
  const capSaldo =
    item.variant?.manage_inventory && !item.variant?.allow_backorder && disponivel != null
      ? Math.max(0, disponivel)
      : undefined
  const maxQuantity = capSaldo != null ? Math.max(item.quantity, capSaldo) : undefined
  const acimaDoSaldo = disponivel != null && item.quantity > Math.max(0, disponivel)

  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className={clx("flex", {
            "w-16": type === "preview",
            "small:w-24 w-12": type === "full",
          })}
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            title={item.product_title}
            size="square"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          className="txt-medium-plus text-ui-fg-base"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <LineItemOptions
          variant={item.variant}
          productTitle={item.product_title}
          data-testid="product-variant"
        />
      </Table.Cell>

      {type === "full" && (
        <Table.Cell>
          {/* w-fit (era w-28=112px): o conteúdo (lixeira + −/input/+) ocupa
              ~155px — com w-28 o "+" vazava pra célula do preço unitário, que
              interceptava o clique (botão inclicável no desktop; fix 09/06) */}
          <div className="flex gap-2 items-center w-fit">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            <QuantityInput
              value={item.quantity}
              max={maxQuantity}
              onChange={(q) => changeQuantity(q)}
              disabled={updating}
              data-testid="product-select-button"
            />
            {updating && <Spinner />}
          </div>
          {acimaDoSaldo && (
            <Text className="txt-small text-rose-500 mt-1" data-testid="stock-warning">
              Só {Math.max(0, disponivel!)} em estoque — reduza a quantidade
            </Text>
          )}
          <ErrorMessage error={error} data-testid="product-error-message" />
        </Table.Cell>
      )}

      {type === "full" && (
        <Table.Cell className="hidden small:table-cell">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </Table.Cell>
      )}

      <Table.Cell className="!pr-0">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
          })}
        >
          {type === "preview" && (
            <Text className="text-ui-fg-subtle">
              {item.quantity}x
              {item.quantity > 1 &&
                ` ${convertToLocale({
                  amount: (item.total ?? 0) / item.quantity,
                  currency_code: currencyCode,
                })}`}
            </Text>
          )}
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
