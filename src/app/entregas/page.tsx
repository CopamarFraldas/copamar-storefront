import { redirect } from "next/navigation"
import { logado } from "./_lib/sessao"
import PinForm from "./_components/pin-form"

export default async function EntregasLogin() {
  if (await logado()) redirect("/entregas/rota")
  return <PinForm />
}
