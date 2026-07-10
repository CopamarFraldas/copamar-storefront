import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import MobileCheckoutBar from "../components/mobile-checkout-bar"
import AvisoRecompra from "../components/aviso-recompra"
import FreeShippingBar from "../components/free-shipping-bar"
import ChegaAmanha from "@modules/shipping/components/chega-amanha"
import RecomendadosCart from "../components/recomendados-cart"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"
import { Suspense } from "react"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  return (
    <div className="py-12">
      <div className="content-container" data-testid="cart-container">
        {/* feedback da recompra "Comprar de novo" (?recompra=X&de=Y) */}
        <AvisoRecompra />
        {cart?.items?.length ? (
          <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-40">
            <div className="flex flex-col bg-ui-bg-base py-6 gap-y-6">
              {!customer && (
                <>
                  <SignInPrompt />
                  <Divider />
                </>
              )}
              <ItemsTemplate cart={cart} />
            </div>
            <div className="relative">
              <div className="flex flex-col gap-y-8 sticky top-12">
                {cart && cart.region && (
                  <>
                    <div className="bg-ui-bg-base py-6 flex flex-col gap-y-4">
                      {/* 🚚 "Chega AMANHÃ até as Xh" — mesma promessa/dado da
                          PDP; CEP do cart ou do localStorage (FreteCep) */}
                      <ChegaAmanha
                        cepConhecido={cart.shipping_address?.postal_code}
                      />
                      {/* barra de frete grátis (Tena-style, 07/06) — só com CEP conhecido */}
                      <FreeShippingBar
                        subtotal={Number(cart.item_subtotal ?? cart.subtotal) || 0}
                        currencyCode={cart.currency_code}
                        cepConhecido={cart.shipping_address?.postal_code}
                      />
                      <Summary cart={cart as any} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
        {/* cross-sell estilo Tena (07/06): recomendados com base no carrinho */}
        {cart?.items?.length ? (
          <Suspense fallback={null}>
            <RecomendadosCart cart={cart} />
          </Suspense>
        ) : null}
      </div>
      {cart?.items?.length ? <MobileCheckoutBar cart={cart as any} /> : null}
    </div>
  )
}

export default CartTemplate
