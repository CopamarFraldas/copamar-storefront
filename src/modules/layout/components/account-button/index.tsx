"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { reorderLastOrder } from "@modules/account/actions"

/**
 * Entrada de CONTA no header — clara em mobile e desktop:
 *  - visitante → "Entrar" (leva pro login/cadastro).
 *  - logado → dropdown: Minha conta · Meus pedidos · Comprar de novo (recompra
 *    de 1 clique do último pedido).
 */
const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
  </svg>
)

const AccountButton = ({ nome }: { nome?: string | null }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const params = useParams()
  const cc = (params?.countryCode as string) || "br"

  useEffect(() => {
    if (!open) return
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
  }, [open])

  // ── visitante ──
  if (!nome) {
    return (
      <LocalizedClientLink
        href="/account"
        data-testid="nav-account-link"
        className="flex items-center gap-x-1.5 text-ui-fg-subtle hover:text-ui-fg-base"
        aria-label="Entrar ou criar conta"
      >
        <UserIcon />
        <span className="hidden small:inline">Entrar</span>
      </LocalizedClientLink>
    )
  }

  // ── logado ──
  const primeiro = nome.split(" ")[0]
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-x-1.5 text-ui-fg-subtle hover:text-ui-fg-base"
        data-testid="nav-account-link"
      >
        <UserIcon />
        <span className="hidden max-w-[7rem] truncate small:inline">{primeiro}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-50 w-56 overflow-hidden rounded-2xl border border-ui-border-base bg-ui-bg-base shadow-xl"
        >
          <p className="px-4 py-2.5 text-xs text-ui-fg-subtle">
            Olá, <strong className="text-ui-fg-base">{primeiro}</strong>
          </p>
          <div className="border-t border-ui-border-base" />
          <LocalizedClientLink
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-ui-fg-base hover:bg-ui-bg-subtle"
          >
            Minha conta
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/account/orders"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-ui-fg-base hover:bg-ui-bg-subtle"
          >
            Meus pedidos
          </LocalizedClientLink>
          <form action={reorderLastOrder}>
            <input type="hidden" name="countryCode" value={cc} />
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-x-2 border-t border-ui-border-base px-4 py-2.5 text-left text-sm font-semibold text-copamar-primary hover:bg-copamar-primary/10"
            >
              🔁 Comprar de novo
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default AccountButton
