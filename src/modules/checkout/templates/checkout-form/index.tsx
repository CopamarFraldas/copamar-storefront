import { getCashbackResgate } from "@lib/data/cashback"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import CashbackResgate from "@modules/checkout/components/cashback-resgate"
import CheckoutLogin from "@modules/checkout/components/checkout-login"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  // Cashback: só pra cliente LOGADO; o servidor decide o quanto dá pra usar
  // (min(saldo, 30% dos produtos)). null = flag OFF / sem saldo / falha → sem box.
  const cashbackResgate = customer
    ? await getCashbackResgate(cart.id).catch(() => null)
    : null

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      {/* visitante: oferta de LOGIN além do cadastro (Marco 04/06) — quem já
          tem conta entra aqui mesmo e o endereço salvo preenche sozinho */}
      {!customer && <CheckoutLogin />}

      <Addresses cart={cart} customer={customer} />

      <Shipping cart={cart} availableShippingMethods={shippingMethods} />

      <Payment
        cart={cart}
        availablePaymentMethods={paymentMethods}
        availableShippingMethods={shippingMethods}
      />

      {/* 💰 resgate de cashback — aparece nos passos payment/review (o próprio
          componente checa o ?step=); fora do PIX-QR-ativo (lock interno) */}
      {cashbackResgate && (
        <CashbackResgate cart={cart} resgate={cashbackResgate} />
      )}

      <Review cart={cart} />
    </div>
  )
}
