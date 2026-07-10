"use client"

/**
 * Botão COMPARTILHAR da PDP (Marco 06/07): "clicar no compartilhar pra mandar
 * pra alguma pessoa".
 *
 * Comportamento:
 * - Mobile (navigator.share disponível) → share sheet NATIVO do aparelho, com
 *   título + texto + URL canônica da PDP. É o caminho da maioria dos clientes.
 * - Desktop (sem Web Share API) → menuzinho com "WhatsApp" (wa.me) e
 *   "Copiar link" (clipboard + feedback "Link copiado ✓" por 2s).
 *
 * URL: sempre a PÚBLICA CANÔNICA (getSiteUrl + /{countryCode}/products/{handle}),
 * a mesma que o metadata canonical da página usa — nunca window.location cru
 * (querystring/UTM não vaza no compartilhamento).
 *
 * A detecção do navigator.share é feita NO CLIQUE (não no render) pra não dar
 * hydration mismatch em página que pode vir cacheada.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { getSiteUrl } from "@lib/util/seo"

type CompartilharProps = {
  /** Nome do produto (vai no título/texto do compartilhamento) */
  titulo: string
  /** Handle da PDP — monta a URL canônica */
  handle: string
  /** Segmento de país da rota (ex.: "br") */
  countryCode: string
  className?: string
}

const IconeShare = () => (
  // ícone "share nodes" (padrão Android/web) — neutro nas duas plataformas
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const IconeWhatsApp = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.668-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
)

const IconeLink = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

const Compartilhar = ({
  titulo,
  handle,
  countryCode,
  className = "",
}: CompartilharProps) => {
  const [menuAberto, setMenuAberto] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const raizRef = useRef<HTMLDivElement>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const copiadoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // URL pública canônica da PDP — mesma regra do metadata canonical da página
  const url = `${getSiteUrl()}/${countryCode}/products/${handle}`
  const texto = `Olha esse produto da Copamar Fraldas: ${titulo}`

  // fecha ao clicar fora / Escape
  useEffect(() => {
    if (!menuAberto) return
    const aoClicarFora = (e: MouseEvent | TouchEvent) => {
      if (raizRef.current && !raizRef.current.contains(e.target as Node)) {
        setMenuAberto(false)
      }
    }
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuAberto(false)
        botaoRef.current?.focus()
      }
    }
    document.addEventListener("mousedown", aoClicarFora)
    document.addEventListener("touchstart", aoClicarFora)
    document.addEventListener("keydown", aoTeclar)
    return () => {
      document.removeEventListener("mousedown", aoClicarFora)
      document.removeEventListener("touchstart", aoClicarFora)
      document.removeEventListener("keydown", aoTeclar)
    }
  }, [menuAberto])

  useEffect(() => {
    return () => {
      if (copiadoTimer.current) clearTimeout(copiadoTimer.current)
    }
  }, [])

  const compartilhar = useCallback(async () => {
    // detecção no clique (não no render) — página pode vir cacheada/SSR
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto, url })
      } catch {
        // usuário cancelou o share sheet — silencioso, é fluxo normal
      }
      return
    }
    setMenuAberto((v) => !v)
  }, [titulo, texto, url])

  const copiarLink = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        // fallback pra browser velho / contexto sem clipboard API
        const ta = document.createElement("textarea")
        ta.value = url
        ta.style.position = "fixed"
        ta.style.opacity = "0"
        document.body.appendChild(ta)
        ta.select()
        document.execCommand("copy")
        document.body.removeChild(ta)
      }
      setCopiado(true)
      if (copiadoTimer.current) clearTimeout(copiadoTimer.current)
      copiadoTimer.current = setTimeout(() => {
        setCopiado(false)
        setMenuAberto(false)
      }, 2000)
    } catch {
      // clipboard bloqueado — mantém o menu aberto pro usuário tentar de novo
    }
  }, [url])

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `${texto} ${url}`
  )}`

  return (
    <div ref={raizRef} className={`relative inline-block ${className}`}>
      <button
        ref={botaoRef}
        type="button"
        onClick={compartilhar}
        aria-haspopup="menu"
        aria-expanded={menuAberto}
        aria-label={`Compartilhar ${titulo}`}
        data-testid="botao-compartilhar"
        className="inline-flex items-center gap-x-1.5 rounded-full border border-ui-border-base bg-ui-bg-base px-3 py-1.5 text-xs font-medium text-ui-fg-subtle transition-colors hover:border-ui-border-strong hover:text-ui-fg-base focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-border-interactive"
      >
        <IconeShare />
        Compartilhar
      </button>

      {menuAberto && (
        <div
          role="menu"
          aria-label="Opções de compartilhamento"
          className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-base shadow-lg"
        >
          <a
            role="menuitem"
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuAberto(false)}
            data-testid="compartilhar-whatsapp"
            className="flex items-center gap-x-2.5 px-4 py-3 text-sm text-ui-fg-base transition-colors hover:bg-ui-bg-subtle focus:outline-none focus-visible:bg-ui-bg-subtle"
          >
            <span className="text-[#25D366]">
              <IconeWhatsApp />
            </span>
            WhatsApp
          </a>
          <button
            role="menuitem"
            type="button"
            onClick={copiarLink}
            data-testid="compartilhar-copiar"
            className="flex w-full items-center gap-x-2.5 border-t border-ui-border-base px-4 py-3 text-left text-sm text-ui-fg-base transition-colors hover:bg-ui-bg-subtle focus:outline-none focus-visible:bg-ui-bg-subtle"
          >
            {copiado ? (
              <span
                className="flex items-center gap-x-2.5 text-emerald-700"
                aria-live="polite"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Link copiado ✓
              </span>
            ) : (
              <>
                <span className="text-ui-fg-subtle">
                  <IconeLink />
                </span>
                Copiar link
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default Compartilhar
