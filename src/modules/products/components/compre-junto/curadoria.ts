/**
 * Curadoria FIXA do "Compre Junto" (Manus 10/07, aprovado pelo Marco) —
 * fonte ÚNICA da lista de complementos de higiene e dos regex de alvo.
 * Módulo puro (sem imports de servidor) de propósito: é compartilhado entre
 * a página de produto (compre-junto, server) e a lateral do carrinho
 * (cross-sell, client). NÃO duplicar esses handles/regex em outro lugar.
 */

export const HANDLE_TOALHA = "toalha-umedecida-tena-confort-40-unidades"
export const HANDLE_LUVA = "luva-de-procedimento-vinil-s-po-p"
export const HANDLE_PROTETOR = "protetor-de-colchao-gerialife-c-6-unidades"

/** Página de produto: toalha + luva + protetor de cama. */
export const COMPLEMENTOS = [HANDLE_TOALHA, HANDLE_LUVA, HANDLE_PROTETOR]

/** Lateral do carrinho (Marco 10/07): máx. 2 sugestões — toalha + luva. */
export const COMPLEMENTOS_DRAWER = [HANDLE_TOALHA, HANDLE_LUVA]

/** Nome curto pro espaço apertado do drawer (fallback: título do produto). */
export const NOME_CURTO: Record<string, string> = {
  [HANDLE_TOALHA]: "Toalha umedecida TENA (40 un.)",
  [HANDLE_LUVA]: "Luva de procedimento vinil",
  [HANDLE_PROTETOR]: "Protetor de colchão (6 un.)",
}

/** Produto-alvo do cross-sell (fralda/pants/absorvente…). */
export const REGEX_ALVO =
  /fralda|pants|slip|absorvente|roupa [íi]ntima|protetor masculino|tena men/i

/** Produto que JÁ é complemento de higiene — nunca recebe a oferta. */
export const REGEX_HIGIENE =
  /luva|toalha|len[çc]ol|protetor de colch[ãa]o|umedecida/i
