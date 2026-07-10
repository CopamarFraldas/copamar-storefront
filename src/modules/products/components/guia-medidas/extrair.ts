/**
 * Extrai a faixa de cintura/quadril (em cm) da DESCRIÇÃO de um produto.
 * As descrições do catálogo marcam a medida em frases como:
 *   "✔ Tamanho M (Média): indicado para cintura aproximada de 73 a 122 cm"
 *   "✔ Tamanho L (G): circunferencia de quadril de 100 a 150 cm"
 *   "faixa de quadril/cintura de 130 a 170 cm"
 * Ancoramos na palavra-chave (cintura/quadril/circunferência) e exigimos o
 * "cm" depois da faixa — assim faixas de PESO ("30 a 70 kg") nunca entram.
 */
const RE_MEDIDA =
  /(?:cinturas?|quadril|circunfer[êe]ncia)[^.\n]{0,60}?(\d{2,3})\s*(?:a|à|até|-|–)\s*(\d{2,3})\s*cm/i

export function extrairMedidaCintura(
  descricao?: string | null
): string | null {
  if (!descricao) return null
  const m = descricao.match(RE_MEDIDA)
  if (!m) return null
  const min = Number(m[1])
  const max = Number(m[2])
  // sanidade: faixas reais do catálogo ficam entre ~50 e ~175 cm
  if (!min || !max || max <= min || min < 40 || max > 200) return null
  return `${min} a ${max} cm`
}
