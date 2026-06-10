import { redirect } from "next/navigation"
import { logado } from "../_lib/sessao"
import { getRota } from "../_lib/dados"
import ListaRota from "./lista"

export default async function RotaPage() {
  if (!(await logado())) redirect("/entregas")
  const paradas = await getRota()
  return <ListaRota paradas={paradas} />
}
