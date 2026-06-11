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

/** Tipo de produto pro filtro da loja (Marco 11/06): separa fraldas de
 * higiene (luvas/toalhas), absorventes, pants e protetores de cama. */
export function inferTipo(
  titulo: string,
  categorias?: HttpTypes.StoreProductCategory[] | null
): string {
  const t = (titulo || "").toLowerCase()
  const nomes = (categorias || []).map((c) => c?.name || "").join(" | ").toLowerCase()
  if (t.includes("pants") || nomes.includes("pants") || nomes.includes("roupa íntima") || nomes.includes("roupa intima"))
    return "Pants (roupa íntima)"
  if (t.includes("protetor") || t.includes("lençol") || t.includes("lencol") || nomes.includes("protetores de cama"))
    return "Protetores de cama"
  if (t.includes("absorvente") || t.startsWith("abs") || / abs\.? /.test(t) || nomes.includes("absorvente"))
    return "Absorventes"
  if (t.includes("fralda") || nomes.includes("fralda"))
    return "Fraldas"
  if (
    t.includes("luva") || t.includes("toalha") || t.includes("lenço") || t.includes("lenco") ||
    t.includes("sabonete") || t.includes("shampoo") || t.includes("creme") || t.includes("algodão") ||
    t.includes("algodao") || t.includes("máscara") || t.includes("mascara") || t.includes("avental") ||
    t.includes("touca") || nomes.includes("higiene")
  )
    return "Higiene (luvas, toalhas…)"
  return "Outros"
}

/** Grupo de ordenação da loja: Tena primeiro (0), infantil por último (2). */
export function grupoLoja(titulo: string, categorias?: HttpTypes.StoreProductCategory[] | null): number {
  if (inferGenero(titulo, categorias) === "Infantil") return 2
  if (inferMarca(titulo) === "Tena") return 0
  return 1
}
