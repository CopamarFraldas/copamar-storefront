import { HttpTypes } from "@medusajs/types"

/**
 * Aviso de RETIRADA NA LOJA na confirmação (Marco 18/06). Só aparece em pedido
 * de retirada (shipping method "Retirar..."). Texto muda pelo pagamento:
 *  - PAGO (PIX, payment_collection completed): fica guardado, sem prazo.
 *  - NÃO PAGO (Pagar na loja, manual): 3 dias úteis; expirou → refaz (sem
 *    garantia de estoque); pra garantir, pague por PIX.
 */
const RetiradaAviso = ({ order }: { order: HttpTypes.StoreOrder }) => {
  const sm = (order.shipping_methods || [])[0] as any
  const pickup = !!sm?.name && /retir/i.test(String(sm.name))
  if (!pickup) return null

  const pago = ((order as any).payment_collections || []).some(
    (pc: any) => pc?.status === "completed"
  )

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-900/20">
      <p className="mb-1 font-medium text-amber-800 dark:text-amber-200">
        🏪 Retirada na loja — Santo André
      </p>
      {pago ? (
        <p className="text-amber-700 dark:text-amber-300">
          <strong>Pago e guardado</strong> pra você. Já está reservado — é só
          passar na loja (Santo André) pra <strong>retirar quando quiser</strong>.
        </p>
      ) : (
        <p className="text-amber-700 dark:text-amber-300">
          Já está reservado pra você — pode <strong>passar na loja</strong>{" "}
          (Santo André) pra retirar e pagar. Você tem <strong>3 dias úteis</strong>;
          passando o prazo, é só refazer (sem garantia de estoque). Pra garantir,
          pague por <strong>PIX</strong> que fica guardado sem prazo.
        </p>
      )}
    </div>
  )
}

export default RetiradaAviso
