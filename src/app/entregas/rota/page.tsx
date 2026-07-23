import { redirect } from "next/navigation"
import { motoristaAtual } from "../_lib/sessao"
import { getPendencias, getRota } from "../_lib/dados"
import ListaRota from "./lista"
import PendenciasAnteriores from "./pendencias"

export default async function RotaPage() {
  // multi-motorista (24/06): identifica o motorista logado e mostra SÓ a rota dele
  const m = await motoristaAtual()
  if (!m) redirect("/entregas")
  const paradas = await getRota(m.id)
  const pendencias = await getPendencias(m.id)
  return (
    <>
      {pendencias.length > 0 && <PendenciasAnteriores pendencias={pendencias} />}
      <ListaRota paradas={paradas} motoristaNome={m.nome} />
    </>
  )
}
