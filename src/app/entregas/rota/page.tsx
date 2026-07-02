import { redirect } from "next/navigation"
import { motoristaAtual } from "../_lib/sessao"
import { getRota } from "../_lib/dados"
import ListaRota from "./lista"

export default async function RotaPage() {
  // multi-motorista (24/06): identifica o motorista logado e mostra SÓ a rota dele
  const m = await motoristaAtual()
  if (!m) redirect("/entregas")
  const paradas = await getRota(m.id)
  return <ListaRota paradas={paradas} motoristaNome={m.nome} />
}
