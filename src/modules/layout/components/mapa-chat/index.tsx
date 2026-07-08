"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Chat da MAPA no site — guardrail do WhatsApp restrito (Meta 24h).
 *
 * Só aparece quando o crew diz que o failover está ATIVO (/api/mapa-chat/status,
 * re-checado a cada 5 min). Todo o tráfego passa pelos proxies /api/mapa-chat/*
 * — o browser nunca vê URL interna nem chave, e a identidade (logado/email/nome)
 * é resolvida server-side.
 *
 * Posição: canto inferior direito, EMPILHADO ACIMA do FAB verde do WhatsApp
 * (bottom-4/6 + 56px + folga). z-[60]: acima do header sticky (z-50) e da barra
 * mobile de compra (z-50), ABAIXO do drawer do carrinho (z-[70]) e do modal de
 * cookies (z-[90]) — quando eles abrem, cobrem o chat, sem briga de camadas.
 *
 * Identidade do visitante: reusa o uuid anônimo do tracking (localStorage
 * "copamar_uuid_anon", o mesmo do copamar-track.js/ponte #47 — o feed liga
 * uuid↔cliente por ele); só cria "copamar_uuid" próprio se o tracking nunca
 * rodou. Histórico em sessionStorage (restaura ao reabrir na mesma sessão).
 */

type Turno = { papel: "cliente" | "mapa"; texto: string }

const BOAS_VINDAS: Turno = {
  papel: "mapa",
  texto:
    "Oi! Sou a MAPA 💙 Posso te ajudar a escolher fraldas, calcular frete e tirar dúvidas. O que você procura?",
}

const FALLBACK_LOCAL =
  "A MAPA está com dificuldade agora 🙈 tenta de novo em instantes?"

const UUID_TRACK_KEY = "copamar_uuid_anon" // do copamar-track.js (reuso, ponte #47)
const UUID_FALLBACK_KEY = "copamar_uuid" // só se o tracking nunca gerou o dele
const HISTORICO_KEY = "copamar_mapa_chat_v1" // sessionStorage
const MAX_TURNOS_ENVIO = 20 // contrato do crew: historico máx 20
const MAX_TURNOS_GUARDADOS = 40 // teto do sessionStorage (não cresce infinito)
const STATUS_INTERVALO_MS = 5 * 60_000

/** uuid v4 com fallback pra browsers sem crypto.randomUUID (mesma tática do track.js) */
const gerarUuid = (): string => {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID()
    }
  } catch {
    /* segue pro fallback */
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === "x" ? r : (r & 3) | 8).toString(16)
  })
}

const obterUuid = (): string => {
  try {
    const doTracking = localStorage.getItem(UUID_TRACK_KEY)
    if (doTracking) return doTracking
    let proprio = localStorage.getItem(UUID_FALLBACK_KEY)
    if (!proprio) {
      proprio = gerarUuid()
      localStorage.setItem(UUID_FALLBACK_KEY, proprio)
    }
    return proprio
  } catch {
    // sem storage (modo privado antigo etc.) → id efêmero válido no proxy (8-64)
    return "sem-storage-0000"
  }
}

const carregarHistorico = (): Turno[] => {
  try {
    const raw = sessionStorage.getItem(HISTORICO_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const validos = parsed.filter(
          (t): t is Turno =>
            typeof t === "object" &&
            t !== null &&
            ((t as Turno).papel === "cliente" ||
              (t as Turno).papel === "mapa") &&
            typeof (t as Turno).texto === "string"
        )
        if (validos.length > 0) return validos
      }
    }
  } catch {
    /* sessão nova / storage bloqueado */
  }
  return [BOAS_VINDAS]
}

const IconeX = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

const IconeEnviar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
  </svg>
)

const MapaChat = () => {
  const [ativo, setAtivo] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [digitando, setDigitando] = useState(false)
  const [texto, setTexto] = useState("")
  // lazy init: no servidor não há sessionStorage (e o 1º render é null mesmo,
  // ativo=false → sem risco de hydration mismatch)
  const [mensagens, setMensagens] = useState<Turno[]>(() =>
    typeof window === "undefined" ? [BOAS_VINDAS] : carregarHistorico()
  )

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  // failover ativo → classe no <html> (mesmo padrão do consent-bar-open):
  // o FAB verde do WhatsApp se esconde via [html.mapa-chat-ativo_&]:hidden —
  // durante a restrição da Meta ele apontaria pra um número mudo. Quando o
  // crew reportar WhatsApp saudável (ativo=false), a classe sai e o FAB volta.
  useEffect(() => {
    const el = document.documentElement
    if (ativo) el.classList.add("mapa-chat-ativo")
    else el.classList.remove("mapa-chat-ativo")
    return () => el.classList.remove("mapa-chat-ativo")
  }, [ativo])

  // status do failover: no mount + a cada 5 min (limpo no unmount)
  useEffect(() => {
    let vivo = true
    const checar = () => {
      fetch("/api/mapa-chat/status", { cache: "no-store" })
        .then((r) => r.json())
        .then((j: { ativo?: boolean }) => {
          if (vivo) setAtivo(j?.ativo === true)
        })
        .catch(() => {
          if (vivo) setAtivo(false)
        })
    }
    checar()
    const id = setInterval(checar, STATUS_INTERVALO_MS)
    return () => {
      vivo = false
      clearInterval(id)
    }
  }, [])

  // persiste o histórico na sessão (teto de 40 mensagens)
  useEffect(() => {
    try {
      sessionStorage.setItem(
        HISTORICO_KEY,
        JSON.stringify(mensagens.slice(-MAX_TURNOS_GUARDADOS))
      )
    } catch {
      /* storage cheio/bloqueado → segue sem persistir */
    }
  }, [mensagens])

  // painel aberto: foco no input + Esc fecha
  useEffect(() => {
    if (!aberto) return
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [aberto])

  // auto-scroll pro fim (scroll SÓ do container — scrollIntoView rolaria a página)
  useEffect(() => {
    const el = listaRef.current
    if (aberto && el) el.scrollTop = el.scrollHeight
  }, [aberto, mensagens, digitando])

  const enviar = useCallback(async () => {
    const msg = texto.trim()
    if (!msg || digitando) return
    // contrato: historico = conversa ANTES da msg nova (últimos 20 turnos)
    const historico = mensagens.slice(-MAX_TURNOS_ENVIO)
    setTexto("")
    if (inputRef.current) inputRef.current.style.height = "auto"
    setMensagens((m) => [...m, { papel: "cliente", texto: msg }])
    setDigitando(true)
    try {
      const r = await fetch("/api/mapa-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid: obterUuid(), msg, historico }),
      })
      const j = (await r.json().catch(() => null)) as {
        resposta?: unknown
      } | null
      const resposta =
        typeof j?.resposta === "string" && j.resposta.length > 0
          ? j.resposta
          : FALLBACK_LOCAL
      setMensagens((m) => [...m, { papel: "mapa", texto: resposta }])
    } catch {
      setMensagens((m) => [...m, { papel: "mapa", texto: FALLBACK_LOCAL }])
    } finally {
      setDigitando(false)
      inputRef.current?.focus()
    }
  }, [texto, digitando, mensagens])

  const onKeyDownInput = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter envia; Shift+Enter quebra linha
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void enviar()
    }
  }

  const onChangeInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTexto(e.target.value)
    // auto-grow até ~4 linhas
    const el = e.target
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`
  }

  // failover desligado (ou ainda não checado) → widget não existe
  if (!ativo) return null

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Abrir chat com a MAPA, assistente virtual da Copamar"
        aria-haspopup="dialog"
        className="fixed right-4 sm:right-6 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] z-[60] flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-copamar-primary text-white shadow-lg shadow-black/20 transition-all duration-200 hover:scale-105 hover:bg-copamar-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copamar-primary focus-visible:ring-offset-2 sm:h-auto sm:w-auto sm:px-5 sm:py-3.5 [html.consent-bar-open_&]:hidden"
      >
        <span className="text-2xl leading-none sm:text-xl" aria-hidden>
          💬
        </span>
        <span className="hidden whitespace-nowrap text-sm font-semibold sm:inline">
          Fale com a MAPA
        </span>
      </button>
    )
  }

  return (
    <div
      role="dialog"
      aria-label="Chat com a MAPA, assistente virtual da Copamar"
      className="fixed inset-x-0 bottom-0 z-[60] flex h-[75vh] w-full flex-col overflow-hidden rounded-t-2xl border border-ui-border-base bg-ui-bg-base shadow-2xl shadow-black/25 animate-in fade-in slide-in-from-bottom-4 duration-200 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[560px] sm:max-h-[calc(100vh-7rem)] sm:w-[380px] sm:rounded-2xl [html.consent-bar-open_&]:hidden"
    >
      {/* header */}
      <div className="flex items-center gap-3 bg-copamar-primary px-4 py-3 text-white">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg"
          aria-hidden
        >
          💙
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">
            MAPA — assistente da Copamar
          </p>
          <p className="truncate text-[11px] leading-tight text-white/75">
            atendimento automático · WhatsApp temporariamente indisponível
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAberto(false)}
          aria-label="Fechar chat"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <IconeX />
        </button>
      </div>

      {/* mensagens */}
      <div
        ref={listaRef}
        className="flex-1 overflow-y-auto bg-ui-bg-subtle px-3 py-4"
        aria-live="polite"
      >
        <ul className="flex flex-col gap-2.5">
          {mensagens.map((m, i) => (
            <li
              key={i}
              className={
                m.papel === "cliente" ? "flex justify-end" : "flex justify-start"
              }
            >
              <span
                className={
                  m.papel === "cliente"
                    ? "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-copamar-primary px-3.5 py-2 text-sm text-white shadow-sm"
                    : "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-bl-md border border-ui-border-base bg-ui-bg-base px-3.5 py-2 text-sm text-ui-fg-base shadow-sm"
                }
              >
                {m.texto}
              </span>
            </li>
          ))}
          {digitando && (
            <li className="flex justify-start">
              <span
                className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-ui-border-base bg-ui-bg-base px-3.5 py-3 shadow-sm"
                role="status"
                aria-label="MAPA está digitando"
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-ui-fg-muted"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </span>
            </li>
          )}
        </ul>
      </div>

      {/* input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void enviar()
        }}
        className="flex items-end gap-2 border-t border-ui-border-base bg-ui-bg-base p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-3"
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={texto}
          onChange={onChangeInput}
          onKeyDown={onKeyDownInput}
          disabled={digitando}
          maxLength={2000}
          placeholder="Escreva sua mensagem…"
          aria-label="Sua mensagem para a MAPA"
          className="max-h-28 min-h-[42px] flex-1 resize-none rounded-xl border border-ui-border-base bg-ui-bg-field px-3 py-2.5 text-sm text-ui-fg-base placeholder:text-ui-fg-muted focus:border-copamar-primary focus:outline-none focus:ring-1 focus:ring-copamar-primary disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={digitando || texto.trim().length === 0}
          aria-label="Enviar mensagem"
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-copamar-primary text-white transition-colors hover:bg-copamar-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copamar-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IconeEnviar />
        </button>
      </form>
    </div>
  )
}

export default MapaChat
