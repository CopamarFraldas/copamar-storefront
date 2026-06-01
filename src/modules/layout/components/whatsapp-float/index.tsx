"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Botão flutuante de WhatsApp — FAB expansível.
 * 1 botão verde na maior parte do tempo. Ao clicar/hover, abre 2 opções:
 *   - Mapa (assistente virtual 24h) — destaque
 *   - Atendente humano (Seg-Sex 8h-17h)
 * Fecha ao clicar fora ou ESC. Sem libs externas.
 */
const WAIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488" />
  </svg>
)

const WhatsAppFloat = () => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // fecha ao clicar fora ou ESC
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div
      ref={ref}
      // sobe pra não cobrir a barra de cookies quando ela está aberta
      // (html.consent-bar-open). transição suave no bottom.
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col items-end gap-3 transition-[bottom] duration-200 [html.consent-bar-open_&]:bottom-28 sm:[html.consent-bar-open_&]:bottom-24"
    >
      {/* opções (aparecem quando aberto) */}
      {open && (
        <>
          <a
            href="https://wa.me/5511952050000?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Copamar%20e%20gostaria%20de%20falar%20com%20um%20atendente."
            target="_blank"
            rel="noopener"
            aria-label="Falar com atendente humano no WhatsApp"
            onClick={() => setOpen(false)}
            className="group flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <span className="rounded-lg bg-white dark:bg-ui-bg-component shadow-md px-3 py-1.5 text-xs font-medium text-ui-fg-base whitespace-nowrap">
              Atendente <span className="text-ui-fg-subtle">· Seg-Sex 8h-17h</span>
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#25D366] bg-white dark:bg-ui-bg-base text-[#25D366] shadow-md transition-transform group-hover:scale-110">
              <WAIcon />
            </span>
          </a>
          <a
            href="https://wa.me/551149903013?text=Ol%C3%A1%20Mapa!%20Vim%20pelo%20site%20da%20Copamar%20e%20gostaria%20de%20ajuda."
            target="_blank"
            rel="noopener"
            aria-label="Falar com a Mapa, assistente virtual 24h da Copamar, no WhatsApp"
            onClick={() => setOpen(false)}
            className="group flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <span className="rounded-lg bg-white dark:bg-ui-bg-component shadow-md px-3 py-1.5 text-xs font-medium text-ui-fg-base whitespace-nowrap">
              Falar com a Mapa <span className="text-ui-fg-subtle">· IA 24h</span>
            </span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition-transform group-hover:scale-110">
              <WAIcon />
            </span>
          </a>
        </>
      )}

      {/* botão principal — ícone alterna entre WhatsApp e X (fechar) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar opções de atendimento" : "Abrir opções de atendimento"}
        aria-expanded={open}
        className={`flex items-center justify-center h-13 w-13 sm:h-14 sm:w-14 rounded-full text-white shadow-lg shadow-black/15 transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          open
            ? "bg-ui-fg-base focus-visible:ring-ui-fg-base rotate-90"
            : "bg-[#25D366] hover:bg-[#1EBE57] focus-visible:ring-[#25D366]"
        }`}
        style={{ width: 56, height: 56 }}
      >
        {open ? (
          // X (close)
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <WAIcon className="w-7 h-7" />
        )}
      </button>
    </div>
  )
}

export default WhatsAppFloat
