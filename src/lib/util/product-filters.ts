import { HttpTypes } from "@medusajs/types"

/**
 * Inferência de MARCA e GÊNERO dos produtos (loja /store, Marco 11/06).
 * Não há campo dedicado no Medusa: a marca sai do título (padrão estável dos
 * 98 produtos migrados do Bling) e o gênero do título + categorias.
 */
export function inferMarca(titulo: string): string {
  const t = (titulo || "").toLowerCase()
  if (t.includes("tena")) return "Tena"
  if (t.includes("biofral")) return "Biofral"
  if (t.includes("abena")) return "Abena"
  if (t.includes("adultcare")) return "Adultcare"
  if (t.includes("enzzo")) return "Enzzo"
  if (t.includes("vita plus") || t.includes("vitaplus")) return "Vita Plus"
  if (t.includes("dryman") || t.includes("dry man") || t.includes("dry brasil") || t.includes("drybrasil")) return "DryBrasil"
  if (t.includes("plena")) return "Plena"
  if (t.includes("comfort life")) return "Comfort Life"
  if (t.includes("bigfral")) return "Bigfral"
  if (t.includes("geriaplus")) return "GeriaPlus"
  return "Outras"
}

export function inferGenero(
  titulo: string,
  categorias?: HttpTypes.StoreProductCategory[] | null
): "Infantil" | "Feminino" | "Masculino" | "Unissex" {
  const t = (titulo || "").toLowerCase()
  const nomes = (categorias || []).map((c) => c?.name || "").join(" | ").toLowerCase()
  if (nomes.includes("infantil") || t.includes("baby") || t.includes("infantil")) return "Infantil"
  if (nomes.includes("feminino") || nomes.includes("lady") || /\blady\b|mulher|feminin/.test(t)) return "Feminino"
  if (nomes.includes("masculino") || nomes.includes("men") || /\bmen\b|masculin|homem|dryman/.test(t)) return "Masculino"
  return "Unissex"
}

/** Grupo de ordenação da loja: Tena primeiro (0), infantil por último (2). */
export function grupoLoja(titulo: string, categorias?: HttpTypes.StoreProductCategory[] | null): number {
  if (inferGenero(titulo, categorias) === "Infantil") return 2
  if (inferMarca(titulo) === "Tena") return 0
  return 1
}
