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
 *
 * CHIPS DE TAMANHO (Marco 10/07, mesma noite): sugestão com irmãos de
 * tamanho (luva P·M·G — cada tamanho é um PRODUTO separado, ligado por
 * metadata.familia) mostra chips grandes pro cliente escolher. Default =
 * MENOR tamanho com estoque; esgotado fica CINZA/desabilitado (nunca some);
 * trocar o chip troca preço, variante do "+ Adicionar" e a soma do combo.
 * Qualquer tamanho da família no carrinho = "já levou luva" (não oferecer
 * P pra quem acabou de levar M). Sem irmãos (toalha) = layout de sempre.
 *
 * Combo = soma real dos 2 preços atuais, sem desconto (decisão futura).
 * Erro: console + falha silenciosa; nunca quebra o drawer.
 */

const emEstoque = (v?: HttpTypes.StoreProductVariant | any) =>
  !!v &&
  (!v.manage_inventory || v.allow_backorder || (v.inventory_quantity ?? 0) > 0)

/** variante REAL da oferta: em estoque E com preço (entre várias, a mais
 * barata) — o preço exibido é SEMPRE o da variante que o botão adiciona */
const melhorVariante = (p: HttpTypes.StoreProduct) =>
  ((p.variants || []) as any[])
    .filter((v) => emEstoque(v) && v.calculated_price)
    .sort(
      (a, b) =>
        a.calculated_price.calculated_amount -
        b.calculated_price.calculated_amount
    )[0]

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
  irmaos = {},
  countryCode,
}: {
  cart: HttpTypes.StoreCart
  produtos: HttpTypes.StoreProduct[]
  /** handle da sugestão → irmãos de tamanho (ordenados P·M·G no server) */
  irmaos?: Record<string, HttpTypes.StoreProduct[]>
  countryCode: string
}) => {
  // handle em andamento ("combo" pro botão dos 2)
  const [adicionando, setAdicionando] = useState<string | null>(null)
  // handle → mostrou "✓ Adicionado"
  const [feito, setFeito] = useState<Record<string, boolean>>({})
  // handle → já saiu da lista (depois do feedback)
  const [sumiu, setSumiu] = useState<Record<string, boolean>>({})
  // handle da sugestão → product.id do irmão escolhido no chip
  const [tamanhoSel, setTamanhoSel] = useState<Record<string, string>>({})

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

  // sugestões visíveis: família fora do carrinho (ou recém-adicionada,
  // exibindo o ✓), com variante em estoque e preço real
  const sugestoes = useMemo(
    () =>
      produtos
        .map((p) => {
          const h = p.handle || ""
          // chips de tamanho: só quando a sugestão tem irmãos (≥2 tamanhos)
          const familia = irmaos[h]
          const chips =
            familia && familia.length >= 2
              ? familia.map((f) => {
                  const v = melhorVariante(f)
                  return {
                    p: f,
                    tamanho: String(
                      ((f.metadata || {}) as any).tamanho || ""
                    ),
                    variante: v,
                    disponivel: !!v,
                  }
                })
              : null
          // "já no carrinho" vale pra FAMÍLIA inteira: quem levou luva M
          // não recebe oferta de luva P
          const idsFamilia = chips ? chips.map((c) => c.p.id) : [p.id]
          // chip default = MENOR tamanho COM estoque (lista já vem ordenada
          // P·M·G do server); esgotou o escolhido → volta pro menor
          const escolhido = chips
            ? chips.find((c) => c.p.id === tamanhoSel[h] && c.disponivel) ||
              chips.find((c) => c.disponivel)
            : null
          const variante = chips ? escolhido?.variante : melhorVariante(p)
          return {
            p,
            h,
            chips,
            idsFamilia,
            escolhido,
            variante,
            preco: variante ? getPricesForVariant(variante) : null,
          }
        })
        .filter((s) => {
          if (sumiu[s.h]) return false
          if (!feito[s.h] && s.idsFamilia.some((id) => idsNoCart.has(id))) {
            return false
          }
          // sem variante = tudo esgotado (família inteira, se houver) → sai
          return !!s.variante && !!s.preco
        }),
    [produtos, irmaos, idsNoCart, feito, sumiu, tamanhoSel]
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
    const h = s.h || s.p.id || ""
    setAdicionando(h)
    // rastreia o produto REAL adicionado (irmão do tamanho escolhido)
    track(s.escolhido?.p.handle || h, "individual")
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
  const pendentes = sugestoes.filter((s) => !feito[s.h])
  const combo = pendentes.length === 2 ? pendentes : null
  // soma = toalha + luva DO TAMANHO ESCOLHIDO (preco já é o da variante ativa)
  const somaCombo = combo
    ? combo.reduce((acc, s) => acc + (s.preco!.calculated_price_number || 0), 0)
    : 0

  const adicionarCombo = async () => {
    if (adicionando || !combo) return
    setAdicionando("combo")
    track(
      combo.map((s) => s.escolhido?.p.handle || s.h).join("+"),
      "combo"
    )
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
      marcarFeito(combo.map((s) => s.h))
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
          const h = s.h
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
                {/* chips de tamanho (P·M·G): alvo grande pro dedo (44px),
                    selecionado com borda+fundo+peso (não só cor), esgotado
                    CINZA desabilitado mas visível */}
                {s.chips && !feito[h] && (
                  <div
                    role="group"
                    aria-label={`Escolha o tamanho de ${NOME_CURTO[h] || s.p.title}`}
                    className="mt-1.5 flex flex-wrap gap-1.5"
                    data-testid="cross-sell-tamanhos"
                  >
                    {s.chips.map((c) => {
                      const ativo = s.escolhido?.p.id === c.p.id
                      return c.disponivel ? (
                        <button
                          key={c.p.id}
                          type="button"
                          // congela a troca durante QUALQUER adição em voo:
                          // trocar o chip no meio mudaria o preço/soma na
                          // tela enquanto o addToCart em andamento adiciona a
                          // variante ANTIGA — o "✓ Adicionado" mentiria
                          disabled={!!adicionando}
                          onClick={() =>
                            setTamanhoSel((t) => ({ ...t, [h]: c.p.id }))
                          }
                          aria-pressed={ativo}
                          aria-label={`Tamanho ${c.tamanho}`}
                          data-testid="cross-sell-chip"
                          className={
                            ativo
                              ? "flex h-11 min-w-[2.75rem] items-center justify-center rounded-lg border border-copamar-primary bg-copamar-primary/10 px-2.5 text-sm font-bold text-copamar-primary ring-1 ring-copamar-primary"
                              : "flex h-11 min-w-[2.75rem] items-center justify-center rounded-lg border border-ui-border-base bg-ui-bg-base px-2.5 text-sm font-medium text-ui-fg-base transition hover:border-copamar-primary/60"
                          }
                        >
                          {c.tamanho}
                        </button>
                      ) : (
                        <button
                          key={c.p.id}
                          type="button"
                          disabled
                          aria-disabled="true"
                          title="Tamanho esgotado"
                          aria-label={`Tamanho ${c.tamanho} esgotado`}
                          data-testid="cross-sell-chip-esgotado"
                          className="flex h-11 min-w-[2.75rem] cursor-not-allowed items-center justify-center rounded-lg border border-ui-border-base bg-ui-bg-subtle px-2.5 text-sm font-medium text-ui-fg-muted opacity-60"
                        >
                          <span className="line-through">{c.tamanho}</span>
                          <span className="sr-only"> esgotado</span>
                        </button>
                      )
                    })}
                  </div>
                )}
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
