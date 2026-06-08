import mapa from "./bussola-mapa.json"

/**
 * Lógica do mini-quiz do Hero "A Bússola que Respira" (07/06).
 * Pura e isolada — a TABELA de produtos/marcas/copy vive em bussola-mapa.json
 * (curada à mão, editável por Marco/Paulo). Aqui só o cruzamento
 * respostas → nível de gota. Sem backend.
 */

export type Quem = "pai_mae" | "outra_pessoa" | "pra_mim"
export type Dia = "ativa" | "casa" | "acamado" | "nao_sei"
export type Pesa = "noite" | "pele" | "discricao" | "trocar_menos"
export type NivelChave = "leve" | "moderado" | "forte" | "intenso" | "noturno"

export type Nivel = {
  chave: NivelChave
  rotulo: string
  aria: string
  produto: {
    handle: string
    titulo: string
    marca: string
    preco: number
    spin360: string
    poster: string
  }
  marcas: string[]
  porque: string
  fraseFragmento: string
}

export const NIVEIS = (mapa.niveis as Nivel[])
export const ORDEM: NivelChave[] = ["leve", "moderado", "forte", "intenso", "noturno"]

export function nivelPorChave(chave: NivelChave): Nivel {
  return NIVEIS.find((n) => n.chave === chave) ?? NIVEIS[0]
}
export function indicePorChave(chave: NivelChave): number {
  return Math.max(0, ORDEM.indexOf(chave))
}

/**
 * Cruza as 3 respostas num nível. Cascata de prioridade CURADA (o que mais
 * pesa decide; o dia a dia desempata). Sempre retorna um nível — "não existe
 * resposta errada".
 */
export function resolverNivel(
  quem: Quem | null,
  dia: Dia | null,
  pesa: Pesa | null
): NivelChave {
  // 1) o que mais pesa manda primeiro
  if (pesa === "noite") return "noturno"
  if (pesa === "trocar_menos") return dia === "ativa" ? "forte" : "intenso"
  if (pesa === "discricao") return dia === "acamado" ? "forte" : "leve"
  if (pesa === "pele") {
    if (dia === "acamado") return "forte"
    if (dia === "ativa") return "moderado"
    return "forte" // dermatológico em casa
  }

  // 2) sem "pesa" claro → o dia a dia define a base
  if (dia === "acamado") return "intenso"
  if (dia === "ativa") return "moderado"
  if (dia === "casa") return "forte"

  // 3) ainda não sei dizer → começa num meio-termo seguro
  return "moderado"
}
