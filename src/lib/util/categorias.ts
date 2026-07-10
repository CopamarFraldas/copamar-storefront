/**
 * Navegação por categoria — helpers compartilhados (melhorias aprovadas 10/07).
 * Motivação (dados de 30 dias): 42% das visitas caem direto em página de
 * produto e as subcategorias quase não recebem clique via menu (Tena 4,
 * Abena 2) — "não estava óbvio que as categorias expandiam".
 */

/** De onde veio o clique — persistido em metadata.origem no eventos_comportamento. */
export type OrigemClickCategoria = "menu" | "chips" | "faixa-categoria"

/**
 * Dispara o evento click_categoria pelo pipeline on-site já existente
 * (copamar-track.js → n8n /webhook/track → RPC registrar_eventos_batch →
 * eventos_comportamento). Fire-and-forget: consentimento LGPD, fila e batch
 * ficam por conta do script; aqui é no-op no SSR ou se o script não carregou.
 * `origem` vai dentro de metadata porque a RPC só persiste colunas conhecidas
 * (categoria É coluna da tabela; origem não).
 */
export function trackClickCategoria(
  handle: string,
  origem: OrigemClickCategoria
) {
  if (typeof window === "undefined") return
  const track = (window as any).copamarTrack
  if (typeof track !== "function") return
  try {
    track("click_categoria", { categoria: handle, metadata: { origem } })
  } catch {
    // tracking NUNCA pode quebrar a navegação
  }
}

/**
 * Escolhe o rótulo da navegação pelo conteúdo REAL das filhas: se a maioria
 * é marca (Tena, Abena, "Outras Marcas"…) fala em marca; senão fala em tipo
 * (Luvas, Absorvente Masculino…). Público 45-65 — rótulo explícito.
 */
const RE_MARCA = /\b(tena|abena|adultcare|biofral|bigfral|plena|dermacare|marca)/i

export function rotuloSubcategorias(nomes: string[]): {
  titulo: string
  rotuloCurto: string
} {
  const marcas = nomes.filter((n) => RE_MARCA.test(n)).length
  const porMarca = marcas > 0 && marcas * 2 >= nomes.length
  return porMarca
    ? { titulo: "Navegue por marca", rotuloCurto: "ver marcas" }
    : { titulo: "Navegue por tipo", rotuloCurto: "ver opções" }
}
