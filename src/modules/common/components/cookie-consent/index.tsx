"use client"

import { useEffect, useState } from "react"
import { Button, clx } from "@medusajs/ui"

const CONSENT_KEY = "copamar_consent_v1"
const UUID_KEY = "copamar_uuid_anon"
const CONSENT_ENDPOINT = "https://n8n.copamarfraldas.com.br/webhook/consent"
const VERSAO = "v1"

type Consent = {
  essencial: true
  analytics: boolean
  marketing: boolean
  versao: string
  ts: string
}

function lsGet(k: string): string | null {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
function lsSet(k: string, v: string): void {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* localStorage indisponível (modo privado/iframe) */
  }
}

// mesmo UUID anônimo usado pelo copamar-track.js — mantém consentimento e eventos coerentes
function uuidv4(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  } catch {
    /* fallback abaixo */
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === "x" ? r : (r & 3) | 8).toString(16)
  })
}
function getUuid(): string {
  let u = lsGet(UUID_KEY)
  if (!u) {
    u = uuidv4()
    lsSet(UUID_KEY, u)
  }
  return u
}

const Toggle = ({
  ativo,
  onChange,
  label,
}: {
  ativo: boolean
  onChange: (v: boolean) => void
  label: string
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={ativo}
    aria-label={label}
    onClick={() => onChange(!ativo)}
    className={clx(
      "relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors",
      ativo ? "bg-emerald-600" : "bg-gray-300"
    )}
  >
    <span
      className={clx(
        "inline-block h-4 w-4 transform rounded-full bg-ui-bg-base transition-transform",
        ativo ? "translate-x-6" : "translate-x-1"
      )}
    />
  </button>
)

const CookieConsent = () => {
  const [visivel, setVisivel] = useState(false)
  const [detalhe, setDetalhe] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(true)

  useEffect(() => {
    // só aparece se ainda não houver decisão registrada
    if (!lsGet(CONSENT_KEY)) {
      setVisivel(true)
    }
    // reabrir pelo link "Configurar cookies" do rodapé
    const abrir = () => {
      const raw = lsGet(CONSENT_KEY)
      if (raw) {
        try {
          const c = JSON.parse(raw) as Consent
          setAnalytics(!!c.analytics)
          setMarketing(!!c.marketing)
        } catch {
          /* ignora json inválido */
        }
      }
      setDetalhe(true)
      setVisivel(true)
    }
    window.addEventListener("open-cookie-consent", abrir)
    return () => window.removeEventListener("open-cookie-consent", abrir)
  }, [])

  // enquanto a barra está aberta, marca o <html> pra o WhatsApp flutuante subir
  // e não cobrir o link "Personalizar" (necessário pra LGPD — o usuário precisa
  // alcançar a customização de consentimento).
  useEffect(() => {
    const el = document.documentElement
    if (visivel) el.classList.add("consent-bar-open")
    else el.classList.remove("consent-bar-open")
    return () => el.classList.remove("consent-bar-open")
  }, [visivel])

  const salvar = (a: boolean, m: boolean) => {
    const consent: Consent = {
      essencial: true,
      analytics: a,
      marketing: m,
      versao: VERSAO,
      ts: new Date().toISOString(),
    }
    lsSet(CONSENT_KEY, JSON.stringify(consent))

    // registra no backend (auditoria LGPD) — fire-and-forget, não bloqueia a UI
    try {
      fetch(CONSENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid: getUuid(),
          essencial: true,
          analytics: a,
          marketing: m,
          versao: VERSAO,
        }),
        keepalive: true,
        credentials: "omit",
        mode: "cors",
      }).catch(() => {})
    } catch {
      /* ignora */
    }

    // avisa o copamar-track.js — começa/para o tracking na hora, sem reload
    try {
      window.dispatchEvent(new CustomEvent("copamar-consent-updated", { detail: consent }))
    } catch {
      /* ignora */
    }

    setVisivel(false)
    setDetalhe(false)
  }

  if (!visivel) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-ui-border-base bg-ui-bg-base shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies e privacidade"
    >
      <div className="content-container mx-auto max-w-4xl px-4 py-3">
        {/* 1ª TELA enxuta (Marco 05/06): "Aceitar todos" (primário) + "Gerenciar"
            (secundário). O recusar continua a 1 passo: dentro do Gerenciar, o
            "Só o necessário" é botão de rodapé bem visível — LGPD ok (recusa
            fácil, não enterrada; 1 clique a mais que o aceite). */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <p className="text-xs leading-snug text-ui-fg-subtle sm:flex-1">
            🍃 Usamos cookies pra melhorar sua experiência. Você decide o que
            aceitar — os essenciais são sempre necessários.
          </p>
          {!detalhe && (
            <div className="flex shrink-0 gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setDetalhe(true)}
                data-testid="consent-customize"
              >
                Gerenciar
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={() => salvar(true, true)}
                data-testid="consent-accept-all"
              >
                Aceitar todos
              </Button>
            </div>
          )}
        </div>

        {detalhe && (
          <div className="mt-3 flex flex-col gap-3 border-t border-ui-border-base pt-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-small-semi text-ui-fg-base">Essenciais</p>
                <p className="text-xsmall-regular text-ui-fg-subtle">
                  Indispensáveis pro funcionamento do site — carrinho, login e segurança.
                  Não podem ser desativados.
                </p>
              </div>
              <span className="text-xsmall-semi mt-1 whitespace-nowrap rounded-full bg-ui-bg-component px-3 py-1 text-ui-fg-subtle">
                Sempre ativo
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-small-semi text-ui-fg-base">Análise (Analytics)</p>
                <p className="text-xsmall-regular text-ui-fg-subtle">
                  Nos ajudam a entender quais produtos e páginas mais interessam, pra
                  melhorar a loja pra você.
                </p>
              </div>
              <Toggle ativo={analytics} onChange={setAnalytics} label="Cookies de análise" />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-small-semi text-ui-fg-base">Marketing</p>
                <p className="text-xsmall-regular text-ui-fg-subtle">
                  Permitem comunicações e ofertas mais relevantes pro seu momento.
                </p>
              </div>
              <Toggle ativo={marketing} onChange={setMarketing} label="Cookies de marketing" />
            </div>

            {/* rodapé do Gerenciar — 2 ações claras e com mesmo peso visual
                (LGPD: recusar os opcionais é 1 clique, bem visível) */}
            <div className="mt-1 flex flex-col gap-2 border-t border-ui-border-base pt-3 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                size="base"
                onClick={() => salvar(false, false)}
                data-testid="consent-essential-only"
                className="sm:min-w-[170px]"
              >
                Só o necessário
              </Button>
              <Button
                variant="primary"
                size="base"
                onClick={() => salvar(analytics, marketing)}
                data-testid="consent-save-prefs"
                className="sm:min-w-[170px]"
              >
                Salvar preferências
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CookieConsent
