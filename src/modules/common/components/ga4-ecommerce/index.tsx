"use client"

import { useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import {
  arred2,
  ga4Event,
  ga4Item,
  ga4ItemDeLineItem,
  ga4Value,
} from "@lib/util/ga4"

/**
 * Componentes de disparo dos eventos GA4 de e-commerce (auditoria 02/07):
 * view_item (PDP) · begin_checkout (checkout) · purchase (confirmação).
 * Renderizam null — só emitem o gtag no mount, pra página servidora precisar
 * de 1 linha. O add_to_cart NÃO mora aqui: precisa da variante escolhida na
 * hora do clique, então é chamada direta no ProductActions.
 *
 * Consent Mode v2 já vem resolvido pelo GoogleAdsTag (default denied +
 * update); com analytics negado o gtag manda pings sem cookie (modelagem).
 */

/** view_item — 1 por visita à PDP (re-navegação remonta e dispara de novo, correto). */
export function Ga4ViewItem({ product }: { product: HttpTypes.StoreProduct }) {
  useEffect(() => {
    if (!product?.id) return
    const { cheapestPrice } = getProductPrice({ product })
    const it = ga4Item({
      item_id: product.variants?.[0]?.sku || product.handle || product.id,
      item_name: product.title ?? "",
      price: cheapestPrice?.calculated_price_number,
      quantity: 1,
    })
    ga4Event("view_item", { value: ga4Value([it]), items: [it] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id])
  return null
}

/** begin_checkout — 1x por carrinho na sessão (F5/voltar no checkout não infla o funil). */
export function Ga4BeginCheckout({ cart }: { cart: HttpTypes.StoreCart }) {
  useEffect(() => {
    if (!cart?.id || !cart.items?.length) return
    const flag = `ga4_begin_${cart.id}`
    try {
      if (sessionStorage.getItem(flag)) return
    } catch {
      /* sessionStorage indisponível → dispara mesmo assim */
    }
    const items = (cart.items || []).map(ga4ItemDeLineItem)
    ga4Event("begin_checkout", {
      value: arred2(Number(cart.total) || ga4Value(items)),
      items,
    })
    try {
      sessionStorage.setItem(flag, "1")
    } catch {
      /* ok */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.id])
  return null
}

/**
 * purchase — transaction_id = display_id (mesmo id da conversão do Ads, os
 * relatórios cruzam) e dedup idêntico ao GoogleAdsConversion: flag por pedido
 * no localStorage, F5/revisita não conta 2x (e o GA4 ainda deduplica
 * server-side por transaction_id se a flag se perder).
 */
export function Ga4Purchase({ order }: { order: HttpTypes.StoreOrder }) {
  useEffect(() => {
    const txid = String(order?.display_id ?? order?.id ?? "")
    if (!txid) return
    const flag = `ga4_purchase_${txid}`
    try {
      if (localStorage.getItem(flag)) return
    } catch {
      /* localStorage indisponível → dispara mesmo assim (dedup por transaction_id) */
    }
    const items = (order.items || []).map(ga4ItemDeLineItem)
    const frete = Number((order as any).shipping_total)
    ga4Event("purchase", {
      transaction_id: txid,
      value: arred2(Number(order.total) || ga4Value(items)),
      // shipping só se veio nos fields do retrieveOrder (fields substitui o default)
      ...(Number.isFinite(frete) ? { shipping: arred2(frete) } : {}),
      items,
    })
    try {
      localStorage.setItem(flag, new Date().toISOString())
    } catch {
      /* ok */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id])
  return null
}
