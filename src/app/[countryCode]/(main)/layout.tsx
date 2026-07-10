import { Metadata } from "next"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import CompararBar from "@modules/layout/components/comparar-bar"
import GoogleStoreWidget from "@modules/common/components/google-store-widget"
import MapaChat from "@modules/layout/components/mapa-chat"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  const customer = await retrieveCustomer()
  const cart = await retrieveCart()
  let shippingOptions: StoreCartShippingOption[] = []

  if (cart) {
    const { shipping_options } = await listCartOptions()

    shippingOptions = shipping_options
  }

  return (
    <>
      <Nav />
      {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}

      {cart && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
      {props.children}
      {/* barra fixa do comparador (⚖) — client, só renderiza com itens
          marcados; some sozinha no carrinho/checkout e na própria /comparar */}
      <CompararBar />
      <Footer />
      {/* selo oficial do Google (store widget) — OFF até o Marco ativar o
          programa no Merchant Center; liga com NEXT_PUBLIC_GOOGLE_STORE_WIDGET=true */}
      <GoogleStoreWidget />
      {/* chat da MAPA no site (guardrail do WhatsApp restrito) — só renderiza
          quando o crew reporta failover ATIVO; fora do checkout e do /entregas
          de propósito (este layout é só a vitrine) */}
      <MapaChat />
    </>
  )
}
