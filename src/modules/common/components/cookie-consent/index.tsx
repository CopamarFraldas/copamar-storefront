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
        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
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
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies e privacidade"
    >
      <div className="content-container mx-auto flex max-w-4xl flex-col gap-4 px-6 py-5">
        <div>
          <h2 className="text-base-semi mb-1 text-gray-900">
            🍃 Sua privacidade é prioridade pra Copamar
          </h2>
          <p className="text-small-regular text-gray-600">
            Usamos cookies pra fazer a loja funcionar, entender como você navega e oferecer
            uma experiência melhor. Você decide o que aceitar. Os cookies essenciais são
            sempre necessários; os demais dependem do seu consentimento.
          </p>
        </div>

        {detalhe && (
          <div className="flex flex-col gap-3 border-t border-gray-100 pt-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-small-semi text-gray-900">Essenciais</p>
                <p className="text-xsmall-regular text-gray-500">
                  Indispensáveis pro funcionamento do site — carrinho, login e segurança.
                  Não podem ser desativados.
                </p>
              </div>
              <span className="text-xsmall-semi mt-1 whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-gray-500">
                Sempre ativo
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-small-semi text-gray-900">Análise (Analytics)</p>
                <p className="text-xsmall-regular text-gray-500">
                  Nos ajudam a entender quais produtos e páginas mais interessam, pra
                  melhorar a loja pra você.
                </p>
              </div>
              <Toggle ativo={analytics} onChange={setAnalytics} label="Cookies de análise" />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-small-semi text-gray-900">Marketing</p>
                <p className="text-xsmall-regular text-gray-500">
                  Permitem comunicações e ofertas mais relevantes pro seu momento.
                </p>
              </div>
              <Toggle ativo={marketing} onChange={setMarketing} label="Cookies de marketing" />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => salvar(false, false)}
            data-testid="consent-essential-only"
          >
            Apenas essenciais
          </Button>
          {detalhe ? (
            <Button
              variant="primary"
              className="w-full sm:w-auto"
              onClick={() => salvar(analytics, marketing)}
              data-testid="consent-save-prefs"
            >
              Salvar preferências
            </Button>
          ) : (
            <Button
              variant="transparent"
              className="w-full sm:w-auto"
              onClick={() => setDetalhe(true)}
              data-testid="consent-customize"
            >
              Personalizar
            </Button>
          )}
          <Button
            variant="primary"
            className="w-full sm:w-auto"
            onClick={() => salvar(true, true)}
            data-testid="consent-accept-all"
          >
            Aceitar todos
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent
