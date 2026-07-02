import { retrieveCustomer } from "@lib/data/customer"
import { Toaster } from "@medusajs/ui"
import AccountLayout from "@modules/account/templates/account-layout"
import { Metadata } from "next"

// Área logada/login NUNCA indexa (higiene SEO, auditoria 02/07). As pages
// filhas (@login/@dashboard) só definem `title`, então este robots herda em
// todas — se alguma page um dia definir `robots` próprio, ele SOBREPÕE este
// (gotcha do App Router: não mescla).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <AccountLayout customer={customer}>
      {customer ? dashboard : login}
      <Toaster />
    </AccountLayout>
  )
}
