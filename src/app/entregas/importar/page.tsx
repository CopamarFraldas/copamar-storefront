import { redirect } from "next/navigation"
import { logado } from "../_lib/sessao"
import ImportarForm from "./form"

export default async function ImportarPage() {
  if (!(await logado())) redirect("/entregas")
  return <ImportarForm />
}
