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
    } else {
      // RE-SYNC do consentimento (03/07): os webhooks /consent e /track ficaram
      // trancados no ORIGIN de staging desde o cutover — quem aceitou cookies em
      // produção tem a decisão SÓ no navegador e o banco recusa os eventos
      // ("sem_consentimento") pra sempre, porque o banner não reaparece. Aqui,
      // 1x/dia, re-envia a decisão salva pro backend (upsert idempotente) e cura
      // o histórico de todo mundo sem incomodar ninguém.
      try {
        const ultimo = Number(lsGet("copamar_consent_sync_ts") || 0)
        if (Date.now() - ultimo > 24 * 60 * 60 * 1000) {
          const c = JSON.parse(lsGet(CONSENT_KEY) || "{}") as Consent
          fetch(CONSENT_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uuid: getUuid(),
              essencial: true,
              analytics: !!c.analytics,
              marketing: !!c.marketing,
              versao: c.versao || VERSAO,
            }),
            keepalive: true,
            credentials: "omit",
            mode: "cors",
          }).catch(() => {})
          lsSet("copamar_consent_sync_ts", String(Date.now()))
        }
      } catch {
        /* re-sync é best-effort */
      }
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

  // enquanto o modal está aberto: marca o <html> (esconde o WhatsApp flutuante)
  // e TRAVA o scroll do fundo — o visitante precisa decidir antes de navegar
  // (Marco 07/06: o banner discreto era ignorado; agora exige uma escolha).
  useEffect(() => {
    const el = document.documentElement
    if (visivel) {
      el.classList.add("consent-bar-open")
      el.style.overflow = "hidden"
      document.body.style.overflow = "hidden"
    } else {
      el.classList.remove("consent-bar-open")
      el.style.overflow = ""
      document.body.style.overflow = ""
    }
    return () => {
      el.classList.remove("consent-bar-open")
      el.style.overflow = ""
      document.body.style.overflow = ""
    }
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
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Aviso de cookies e privacidade"
    >
      {/* MODAL (Marco 07/06): card centralizado com fundo escurecido que
          bloqueia a navegação até a pessoa escolher — o banner-faixa antigo
          era ignorado. O backdrop NÃO fecha (escolha obrigatória); a recusa
          ("Só essenciais") tem o MESMO destaque do aceite na 1ª tela, então
          continua LGPD-ok (não é cookie wall: recusar é tão fácil quanto
          aceitar, 1 clique cada). */}
      <div className="w-full max-w-md rounded-t-2xl border border-ui-border-base bg-ui-bg-base p-5 shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300 sm:rounded-2xl sm:p-6">
        {!detalhe ? (
          <>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-2xl" aria-hidden>
                🍃
              </span>
              <h2 className="text-base font-semibold text-ui-fg-base">
                Sua privacidade importa
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-ui-fg-subtle">
              Usamos cookies pra melhorar sua experiência, lembrar seu carrinho
              e entender o que mais ajuda você. Você decide o que aceitar — os
              essenciais são sempre necessários. Saiba mais na nossa{" "}
              <a
                href="/br/politica-de-privacidade"
                className="font-medium text-copamar-primary underline underline-offset-2 hover:text-ui-fg-base"
              >
                Política de Privacidade
              </a>
              .
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button
                variant="primary"
                size="large"
                onClick={() => salvar(true, true)}
                data-testid="consent-accept-all"
                className="w-full"
              >
                Aceitar todos
              </Button>
              <Button
                variant="secondary"
                size="large"
                onClick={() => salvar(false, false)}
                data-testid="consent-essential-only"
                className="w-full"
              >
                Só essenciais
              </Button>
              <button
                type="button"
                onClick={() => setDetalhe(true)}
                data-testid="consent-customize"
                className="mt-1 text-center text-xs font-medium text-ui-fg-subtle underline underline-offset-2 hover:text-ui-fg-base"
              >
                Personalizar preferências
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3">
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
                data-testid="consent-essential-only-detalhe"
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
