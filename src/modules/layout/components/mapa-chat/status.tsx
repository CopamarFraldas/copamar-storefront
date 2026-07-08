"use client"

import { useEffect } from "react"

/**
 * Ponte de STATUS do chat da MAPA — mora no GlobalChrome (root layout), não no
 * widget: o FAB verde do WhatsApp aparece em TODA a loja (inclusive checkout,
 * onde o widget não é montado) e precisa sumir durante a restrição da Meta —
 * checkout é justamente onde cliente com dúvida clicaria no botão mudo.
 *
 * Fonte ÚNICA da checagem (/api/mapa-chat/status no mount + a cada 5 min):
 *   1. seta/tira html.mapa-chat-ativo → o WhatsAppFloat se esconde via
 *      [html.mapa-chat-ativo_&]:hidden (mesmo padrão do consent-bar-open);
 *   2. avisa via CustomEvent (padrão da casa: copamar-drawer,
 *      copamar-consent-updated) → o MapaChat (só na vitrine) liga/desliga
 *      SEM fetch próprio — zero chamada duplicada.
 */

export const MAPA_CHAT_CLASSE_HTML = "mapa-chat-ativo"
export const MAPA_CHAT_EVENTO = "copamar-mapa-chat"

const INTERVALO_MS = 5 * 60_000

/** Estado atual (a classe no <html> é a fonte da verdade entre componentes). */
export const lerStatusMapaChat = (): boolean =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains(MAPA_CHAT_CLASSE_HTML)

const MapaChatStatusBridge = () => {
  useEffect(() => {
    let vivo = true
    const aplicar = (ativo: boolean) => {
      if (!vivo) return
      document.documentElement.classList.toggle(MAPA_CHAT_CLASSE_HTML, ativo)
      window.dispatchEvent(
        new CustomEvent(MAPA_CHAT_EVENTO, { detail: { ativo } })
      )
    }
    const checar = () => {
      fetch("/api/mapa-chat/status", { cache: "no-store" })
        .then((r) => r.json())
        .then((j: { ativo?: boolean }) => aplicar(j?.ativo === true))
        .catch(() => aplicar(false))
    }
    checar()
    const id = setInterval(checar, INTERVALO_MS)
    return () => {
      vivo = false
      clearInterval(id)
      document.documentElement.classList.remove(MAPA_CHAT_CLASSE_HTML)
    }
  }, [])
  return null
}

export default MapaChatStatusBridge
