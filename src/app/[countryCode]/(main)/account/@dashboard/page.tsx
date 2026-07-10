import { Metadata } from "next"

import Overview from "@modules/account/components/overview"
import ConfirmarCelular from "@modules/account/components/confirmar-celular"
import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { getCashbackSaldo } from "@lib/data/cashback"
import { listarEntregasProgramadas } from "@lib/data/entrega-programada"
import { listOrders } from "@lib/data/orders"

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Visão geral da sua conta Copamar.",
}

export default async function OverviewTemplate(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
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

  // Cashback (#saldo): rota autenticada; null quando a flag CASHBACK_ATIVO
  // está OFF, o backend falhou ou não há programa → o card simplesmente some.
  // Entregas programadas: mesma lógica (flag copamar_kv 'entrega_programada').
  const [orders, cashback, entregasProgramadas, searchParams] =
    await Promise.all([
      listOrders().catch(() => null),
      getCashbackSaldo().catch(() => null),
      listarEntregasProgramadas().catch(() => null),
      props.searchParams ?? Promise.resolve({}),
    ])

  // veio do link mágico com ciclo já pago/vencido (?ep=ciclo) → aviso gentil
  const avisoCicloEp = (searchParams as any)?.ep === "ciclo"

  return (
    <Overview
      customer={customer}
      orders={orders}
      cashback={cashback}
      entregasProgramadas={entregasProgramadas}
      avisoCicloEp={avisoCicloEp}
    />
  )
}
