import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import { retrieveCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Compras anteriores",
  description: "Seu histórico de compras do site antigo da Copamar.",
}

/**
 * Histórico do SITE ANTIGO (migração Magento→Medusa, Marco 10/06): lê do
 * backend (/store/migracao/minhas-compras → Bling por bling_id). Read-only.
 * Pedidos do site novo seguem na aba "Pedidos".
 */
const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
const dataBr = (iso: string) =>
  iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "—"

export default async function ComprasAnteriores() {
  const customer = await retrieveCustomer().catch(() => null)
  if (!customer) notFound()

  let pedidos: { numero: string; data: string; total: number; situacao: string }[] = []
  try {
    const headers = await getAuthHeaders()
    const r = await sdk.client.fetch<{ pedidos: typeof pedidos }>(
      "/store/migracao/minhas-compras",
      { method: "GET", headers, cache: "no-store" }
    )
    pedidos = r?.pedidos || []
  } catch {}

  return (
    <div className="w-full" data-testid="compras-anteriores-page">
      <div className="mb-8 flex flex-col gap-y-2">
        <h1 className="text-2xl-semi">Compras anteriores</h1>
        <p className="text-base-regular text-ui-fg-subtle">
          Seu histórico do nosso site antigo — preservado na migração. 💙 As
          compras feitas aqui no site novo aparecem na aba{" "}
          <strong>Pedidos</strong>.
        </p>
      </div>

      {pedidos.length === 0 ? (
        <p className="rounded-large border border-ui-border-base bg-ui-bg-subtle p-5 text-ui-fg-subtle">
          Não encontramos compras anteriores vinculadas à sua conta. Se você
          acha que algo deveria aparecer aqui, fale com a gente no WhatsApp que
          resolvemos juntos.
        </p>
      ) : (
        <div className="overflow-hidden rounded-large border border-ui-border-base">
          <table className="w-full text-left text-sm">
            <thead className="bg-ui-bg-subtle text-ui-fg-subtle">
              <tr>
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Situação</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={`${p.numero}-${p.data}`} className="border-t border-ui-border-base">
                  <td className="px-4 py-3 font-medium text-ui-fg-base">#{p.numero}</td>
                  <td className="px-4 py-3">{dataBr(p.data)}</td>
                  <td className="px-4 py-3">{brl(p.total)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.situacao === "Cancelado"
                          ? "text-rose-500"
                          : p.situacao === "Concluído"
                            ? "text-emerald-600"
                            : "text-ui-fg-subtle"
                      }
                    >
                      {p.situacao}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
