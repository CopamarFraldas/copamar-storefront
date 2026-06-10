import { Metadata } from "next"

import Overview from "@modules/account/components/overview"
import ConfirmarCelular from "@modules/account/components/confirmar-celular"
import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Visão geral da sua conta Copamar.",
}

export default async function OverviewTemplate() {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    notFound()
  }

  // Cliente MIGRADO que ainda não confirmou o WhatsApp vê a tela de confirmação
  // ANTES do overview (Marco 10/06, bug do "último dígito" do site antigo).
  // Não-bloqueante: "confirmar depois" navega pra outra aba e some nesta visita.
  const meta = (customer.metadata || {}) as Record<string, any>
  if (meta.migrado && !meta.celular_confirmado) {
    return (
      <ConfirmarCelular
        telefoneAtual={customer.phone || ""}
        nome={customer.first_name || ""}
      />
    )
  }

  const orders = (await listOrders().catch(() => null)) || null
  return <Overview customer={customer} orders={orders} />
}
