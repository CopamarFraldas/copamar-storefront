import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@medusajs/ui"

import Item from "@modules/cart/components/item"
import ItemMobile from "@modules/cart/components/item-mobile"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  const sorted = items
    ? [...items].sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
    : null
  return (
    <div>
      <div className="pb-3 flex items-center">
        <Heading className="text-[2rem] leading-[2.75rem]">Carrinho</Heading>
      </div>

      {/* MOBILE: cards empilhados (a tabela espremia nome/foto — Marco 04/06) */}
      <ul className="small:hidden">
        {sorted
          ? sorted.map((item) => (
              <ItemMobile key={item.id} item={item} currencyCode={cart!.currency_code} />
            ))
          : repeat(3).map((i) => (
              <li key={i} className="flex gap-x-4 border-b border-ui-border-base py-4">
                <div className="h-24 w-24 animate-pulse rounded-lg bg-ui-bg-subtle" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-ui-bg-subtle" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-ui-bg-subtle" />
                </div>
              </li>
            ))}
      </ul>

      {/* DESKTOP: tabela (inalterada) */}
      <Table className="hidden small:table">
        <Table.Header className="border-t-0">
          <Table.Row className="text-ui-fg-subtle txt-medium-plus">
            <Table.HeaderCell className="!pl-0">Item</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
            <Table.HeaderCell>Quantidade</Table.HeaderCell>
            <Table.HeaderCell className="hidden small:table-cell">
              Preço
            </Table.HeaderCell>
            <Table.HeaderCell className="!pr-0 text-right">
              Total
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {sorted
            ? sorted.map((item) => (
                <Item key={item.id} item={item} currencyCode={cart!.currency_code} />
              ))
            : repeat(5).map((i) => <SkeletonLineItem key={i} />)}
        </Table.Body>
      </Table>
    </div>
  )
}

export default ItemsTemplate
