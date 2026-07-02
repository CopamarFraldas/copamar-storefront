import { notFound } from "next/navigation"

import { getRegion } from "@lib/data/regions"

/**
 * Guarda do segmento [countryCode] — mata o soft-200 (auditoria 02/07).
 *
 * O middleware deixa passar qualquer path com "." (bypass necessário pros
 * assets reais de /public), então URLs lixo do legado Magento (ex.
 * /pagina-velha.html, ~984 no Search Console) caíam aqui como
 * countryCode="pagina-velha.html" e renderizavam a HOME em 200 indexável com
 * canonical próprio — gerador infinito de conteúdo duplicado. Este layout
 * valida o código antes de renderizar qualquer coisa e devolve 404 REAL.
 */
export default async function CountryCodeLayout(props: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  // 1º gate barato: só iso-2 minúsculo tem chance de ser região válida.
  // Corta todo o lixo (/brasil, /*.html, /*.txt…) sem tocar no backend.
  if (!/^[a-z]{2}$/.test(countryCode)) {
    notFound()
  }

  // 2º gate: o código precisa existir nas regiões reais do Medusa (cacheado —
  // mesma fonte que o resto do app usa). getRegion devolve null pra inválido.
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  return props.children
}
