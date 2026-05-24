"use client"

// Link do rodapé que reabre o banner de cookies (LGPD: usuário pode revisar a
// qualquer momento). Dispara o evento escutado pelo <CookieConsent />.
const ConfigurarCookiesButton = () => {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-cookie-consent"))}
      className="txt-compact-small hover:text-ui-fg-base text-left transition-colors"
    >
      Configurar cookies
    </button>
  )
}

export default ConfigurarCookiesButton
