"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Botão "Falar no WhatsApp" que abre 2 opções (Marco 09/06): a MAPA (assistente
 * virtual, responde na hora) ou o atendimento com especialista (time humano).
 * Popover acessível — fecha ao clicar fora ou Esc.
 */
const OPCOES = [
  {
    label: "Falar com a MAPA",
    sub: "assistente virtual · responde na hora",
    href:
      "https://wa.me/551141190201?text=" +
      encodeURIComponent("Olá! Quero ajuda para escolher minha fralda."),
  },
  {
    label: "Atendimento com especialista",
    sub: "time humano da Copamar",
    href:
      "https://wa.me/5511952050000?text=" +
      encodeURIComponent("Olá! Quero falar com um especialista da Copamar."),
  },
]

function IconeWhats() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.477-.999zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  )
}

export default function BotaoWhatsApp({ secundario = false }: { secundario?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={
          // Verde #15803d (green-700) no lugar do #25D366 da marca: o verde claro
          // dava 1,98:1 de contraste (reprova WCAG AA); o escuro dá 5,0:1 e o
          // botão continua "verde de WhatsApp". O ícone pequeno do popover mantém
          // o verde da marca (decorativo, ao lado de texto escuro).
          secundario
            ? // SECUNDÁRIO (hero): outline/ghost verde, menor — de-enfatiza vs "Comprar agora"
              "inline-flex w-auto items-center justify-center gap-2 rounded-large border-2 border-[#15803d] bg-transparent px-4 py-2 text-sm font-semibold text-[#15803d] transition-colors hover:bg-[#15803d]/10 small:px-5 small:py-2.5"
            : // PADRÃO: verde sólido cheio
              "inline-flex w-full items-center justify-center gap-2 rounded-large bg-[#15803d] px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 small:w-auto"
        }
      >
        <IconeWhats /> Falar no WhatsApp
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-1/2 z-30 mt-2 w-72 -translate-x-1/2 overflow-hidden rounded-large border border-ui-border-base bg-ui-bg-base shadow-xl small:left-0 small:translate-x-0"
        >
          {OPCOES.map((o) => (
            <a
              key={o.href}
              href={o.href}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className="flex items-start gap-3 border-b border-ui-border-base px-4 py-3 last:border-0 hover:bg-copamar-primary/5"
            >
              <span className="mt-0.5 text-[#25D366]">
                <IconeWhats />
              </span>
              <span className="leading-snug">
                <span className="block text-sm font-semibold text-ui-fg-base">
                  {o.label}
                </span>
                <span className="block text-xs text-ui-fg-subtle">{o.sub}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
