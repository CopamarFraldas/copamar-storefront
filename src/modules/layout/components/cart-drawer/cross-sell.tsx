"use client"

import { addToCart } from "@lib/data/cart"
import { getPricesForVariant } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import {
  NOME_CURTO,
  REGEX_ALVO,
  REGEX_HIGIENE,
} from "@modules/products/components/compre-junto/curadoria"
import Thumbnail from "@modules/products/components/thumbnail"
import { useMemo, useState } from "react"

/**
 * "Vai levar junto?" na LATERAL do carrinho (Marco 10/07): oferece toalha
 * umedecida + luva quando o carrinho tem fralda/pants/absorvente e o
 * complemento ainda não está nele. Curadoria/regex vêm de compre-junto/
 * curadoria (fonte única). Os produtos chegam prontos por props (buscados
 * cacheados no CartButton, server) — abrir o drawer NÃO dispara fetch.
 * Combo = soma real dos 2 preços atuais, sem desconto (decisão futura).
 * Erro: console + falha silenciosa; nunca quebra o drawer.
 */

const emEstoque = (v?: HttpTypes.StoreProductVariant | any) =>
  !!v &&
  (!v.manage_inventory || v.allow_backorder || (v.inventory_quantity ?? 0) > 0)

/** Evento comportamental fire-and-forget (pipeline copamar-track, opcional). */
const track = (item: string, modo: "individual" | "combo") => {
  try {
    const fn = (window as any).copamarTrack
    if (typeof fn === "function") {
      fn("cross_sell_carrinho", { metadata: { item, modo } })
    }
  } catch {
    // tracking NUNCA pode quebrar o drawer
  }
}

const CartCrossSell = ({
  cart,
  produtos,
  countryCode,
}: {
  cart: HttpTypes.StoreCart
  produtos: HttpTypes.StoreProduct[]
  countryCode: string
}) => {
  // handle em andamento ("combo" pro botão dos 2)
  const [adicionando, setAdicionando] = useState<string | null>(null)
  // handle → mostrou "✓ Adicionado"
  const [feito, setFeito] = useState<Record<string, boolean>>({})
  // handle → já saiu da lista (depois do feedback)
  const [sumiu, setSumiu] = useState<Record<string, boolean>>({})

  // mesma regra do "Compre Junto" da página de produto: precisa de um
  // produto-alvo no carrinho que não seja ele próprio um item de higiene
  const temAlvo = (cart.items || []).some(
    (i) =>
      REGEX_ALVO.test(i.product_title || "") &&
      !REGEX_HIGIENE.test(i.product_title || "")
  )

  const idsNoCart = useMemo(
    () => new Set((cart.items || []).map((i: any) => i.product_id)),
    [cart.items]
  )

  // sugestões visíveis: fora do carrinho (ou recém-adicionada, exibindo o ✓),
  // com variante em estoque e preço real
  const sugestoes = useMemo(
    () =>
      produtos
        .filter((p) => {
          const h = p.handle || ""
          if (sumiu[h]) return false
          if (idsNoCart.has(p.id) && !feito[h]) return false
          return true
        })
        .map((p) => {
          // variante REAL da oferta: em estoque E com preço (entre várias,
          // a mais barata) — o preço exibido é SEMPRE o da variante que o
          // botão adiciona, nunca o de uma variante esgotada/mais barata
          const variante = (p.variants || [])
            .filter((v: any) => emEstoque(v) && v.calculated_price)
            .sort(
              (a: any, b: any) =>
                a.calculated_price.calculated_amount -
                b.calculated_price.calculated_amount
            )[0]
          return {
            p,
            variante,
            preco: variante ? getPricesForVariant(variante) : null,
          }
        })
        .filter((s) => !!s.variante && !!s.preco),
    [produtos, idsNoCart, feito, sumiu]
  )

  if (!temAlvo || !sugestoes.length) {
    return null
  }

  const marcarFeito = (handles: string[]) => {
    const marca: Record<string, boolean> = {}
    handles.forEach((h) => (marca[h] = true))
    setFeito((f) => ({ ...f, ...marca }))
    // some da lista depois do "✓ Adicionado" (o item já aparece no carrinho)
    setTimeout(() => setSumiu((x) => ({ ...x, ...marca })), 1800)
  }

  const adicionar = async (s: (typeof sugestoes)[number]) => {
    if (adicionando) return
    const h = s.p.handle || s.p.id || ""
    setAdicionando(h)
    track(h, "individual")
    try {
      await addToCart({ variantId: s.variante!.id!, quantity: 1, countryCode })
      marcarFeito([h])
    } catch (e) {
      console.error("[cross-sell carrinho] falha ao adicionar", e)
    } finally {
      setAdicionando(null)
    }
  }

  // combo só quando as DUAS sugestões estão pendentes
  const pendentes = sugestoes.filter((s) => !feito[s.p.handle || ""])
  const combo = pendentes.length === 2 ? pendentes : null
  const somaCombo = combo
    ? combo.reduce((acc, s) => acc + (s.preco!.calculated_price_number || 0), 0)
    : 0

  const adicionarCombo = async () => {
    if (adicionando || !combo) return
    setAdicionando("combo")
    track(combo.map((s) => s.p.handle).join("+"), "combo")
    try {
      // sequencial de propósito: dois createLineItem em paralelo no mesmo
      // carrinho podem se atropelar
      for (const s of combo) {
        await addToCart({
          variantId: s.variante!.id!,
          quantity: 1,
          countryCode,
        })
      }
      marcarFeito(combo.map((s) => s.p.handle || ""))
    } catch (e) {
      console.error("[cross-sell carrinho] falha ao adicionar combo", e)
    } finally {
      setAdicionando(null)
    }
  }

  return (
    <div
      className="mt-4 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3"
      data-testid="cart-cross-sell"
    >
      <p className="text-sm font-semibold text-ui-fg-base">Vai levar junto? 🧺</p>
      <p className="mb-3 text-xs text-ui-fg-subtle">
        Completa o cuidado e chega tudo numa entrega só:
      </p>
      <ul className="flex flex-col gap-y-3">
        {sugestoes.map((s) => {
          const h = s.p.handle || ""
          return (
            <li key={s.p.id} className="flex items-center gap-x-3">
              <div className="w-14 shrink-0">
                <Thumbnail
                  thumbnail={s.p.thumbnail}
                  images={s.p.images}
                  title={s.p.title}
                  size="square"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-ui-fg-base line-clamp-2">
                  {NOME_CURTO[h] || s.p.title}
                </p>
                <p className="text-sm font-semibold text-ui-fg-base">
                  {s.preco!.calculated_price}
                </p>
              </div>
              {feito[h] ? (
                <span
                  className="shrink-0 text-sm font-medium text-green-700 dark:text-green-400"
                  data-testid="cross-sell-adicionado"
                >
                  ✓ Adicionado
                </span>
              ) : (
                <Button
                  variant="secondary"
                  className="shrink-0 px-4"
                  disabled={!!adicionando}
                  isLoading={adicionando === h}
                  onClick={() => adicionar(s)}
                  data-testid="cross-sell-add"
                >
                  + Adicionar
                </Button>
              )}
            </li>
          )
        })}
      </ul>
      {combo && (
        <div className="mt-3 border-t border-ui-border-base pt-3">
          <p className="mb-2 text-sm text-ui-fg-base">
            Leve os 2 juntos:{" "}
            <span className="font-semibold">
              + {convertToLocale({
                amount: somaCombo,
                currency_code: combo[0].preco!.currency_code,
              })}
            </span>
          </p>
          <Button
            className="w-full"
            disabled={!!adicionando}
            isLoading={adicionando === "combo"}
            onClick={adicionarCombo}
            data-testid="cross-sell-add-combo"
          >
            Adicionar toalha e luva
          </Button>
        </div>
      )}
    </div>
  )
}

export default CartCrossSell
