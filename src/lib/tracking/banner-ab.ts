/**
 * A/B do banner do topo da home (10/07): esteira infinita (atual, variante A)
 * vs carrossel estático acessível (variante B — ressalva WCAG 2.2.2 da super
 * análise pro público 45-65).
 *
 * - Sorteio 50/50 persistente por visitante em localStorage (copamar_ab_banner),
 *   sorteado UMA vez — mesmo padrão de chave dos outros storages do site
 *   (copamar_uuid_anon, copamar_consent_v1). O uuid anônimo vai junto em todo
 *   evento pelo próprio copamar-track.js, então dá pra cruzar variante×visitante.
 * - Medição fire-and-forget via window.copamarTrack (pipeline copamar-track →
 *   n8n /webhook/track). SEM consentimento de analytics o pipeline descarta
 *   tudo sozinho — aqui a gente só chama, nunca decide sobre LGPD.
 * - Kill switch: NEXT_PUBLIC_BANNER_AB !== "on" → page.tsx nem monta o A/B
 *   (todo mundo vê a esteira atual, zero JS novo).
 *
 * Client-only (localStorage/window) — chamar apenas dentro de useEffect/handlers.
 */

export type BannerVariant = "esteira" | "carrossel"

const AB_KEY = "copamar_ab_banner"

/** Lê a variante sorteada; se não existe, sorteia 50/50 e persiste (1x por visitante). */
export function getBannerVariant(): BannerVariant {
  try {
    const v = localStorage.getItem(AB_KEY)
    if (v === "esteira" || v === "carrossel") return v
    const sorteio: BannerVariant = Math.random() < 0.5 ? "esteira" : "carrossel"
    localStorage.setItem(AB_KEY, sorteio)
    return sorteio
  } catch {
    // localStorage bloqueado (modo privado/iframe) → sem persistência confiável,
    // cai na variante atual pra não poluir o teste com visitantes "voláteis"
    return "esteira"
  }
}

/**
 * Evento do teste, fire-and-forget. O copamar-track.js entra por lazyOnload e
 * pode ainda não ter carregado quando o banner monta — retry curto (até ~10s)
 * pra não perder o banner_view do início do pageview. NUNCA lança erro.
 */
export function trackBanner(
  tipo: "banner_view" | "banner_click",
  metadata: Record<string, string>
) {
  if (typeof window === "undefined") return
  let tentativas = 0
  const tenta = () => {
    try {
      const fn = (window as any).copamarTrack
      if (typeof fn === "function") {
        fn(tipo, { metadata })
        return
      }
    } catch {
      return // tracking nunca pode quebrar o banner
    }
    if (++tentativas < 10) setTimeout(tenta, 1000)
  }
  tenta()
}

/**
 * Identificador estável do painel pro banner_click: nome do arquivo da arte
 * (ex.: "frete_gratis" de /banners-esteira/frete_gratis.webp — mesmo nome dos
 * seeds do admin). Fallback: link ou começo da URL da imagem.
 */
export function painelId(b: { image_url: string; link?: string }): string {
  const m = b.image_url.match(/\/([^/?#]+)\.[a-z0-9]+(?:[?#]|$)/i)
  if (m) return m[1]
  return b.link || b.image_url.slice(0, 80)
}
