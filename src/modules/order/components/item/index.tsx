import { HttpTypes } from "@medusajs/types"
import { Table, Text } from "@medusajs/ui"

import { convertToLocale } from "@lib/util/money"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import Thumbnail from "@modules/products/components/thumbnail"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
}

const Item = ({ item, currencyCode }: ItemProps) => {
  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <div className="flex w-16">
          <Thumbnail thumbnail={item.thumbnail} title={item.product_title ?? undefined} size="square" />
        </div>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          className="txt-medium-plus text-ui-fg-base"
          data-testid="product-name"
        >
          {item.product_title}
        </Text>
        <LineItemOptions
          variant={item.variant}
          productTitle={item.product_title}
          data-testid="product-variant"
        />
      </Table.Cell>

      <Table.Cell className="!pr-0">
        <span className="!pr-0 flex flex-col items-end h-full justify-center">
          {/* Quantidade × preço unitário só pra 2+ unidades (pra 1, o total
              abaixo já é o preço). LineItemPrice é o ÚNICO que mostra
              desconto/riscado — senão o riscado e o preço com desconto
              apareciam DUAS vezes por item (Marco 18/06). */}
          {item.quantity > 1 && (
            <span className="flex gap-x-1 text-ui-fg-subtle text-small-regular">
              <span data-testid="product-quantity">{item.quantity}</span>
              <span>×</span>
              <span data-testid="product-unit-price">
                {convertToLocale({
                  amount: (item.total ?? 0) / item.quantity,
                  currency_code: currencyCode,
                })}
              </span>
            </span>
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
