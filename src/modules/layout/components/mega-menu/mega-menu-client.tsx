"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { rotuloSubcategorias, trackClickCategoria } from "@lib/util/categorias"
import type { NavCat } from "@lib/data/nav-categories"

type Props = { categories: NavCat[] }

/**
 * Navegação principal com mega-menu (desktop) e drawer hamburger (mobile).
 * Contagens vêm das props (sem hardcode). Mantém o que já existe ao redor
 * (Blog, Quem somos, Minha conta, Tema, Carrinho) — esse componente substitui
 * só o link antigo de "Fraldas Geriátricas".
 */
const MegaMenuClient = ({ categories }: Props) => {
  // ── DESKTOP: painel com hover-intent + clique + ESC ──
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const openTimer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)

  const clearTimers = () => {
    if (openTimer.current) { window.clearTimeout(openTimer.current); openTimer.current = null }
    if (closeTimer.current) { window.clearTimeout(closeTimer.current); closeTimer.current = null }
  }
  const scheduleOpen = useCallback(() => { clearTimers(); openTimer.current = window.setTimeout(() => setOpen(true), 100) }, [])
  const scheduleClose = useCallback(() => { clearTimers(); closeTimer.current = window.setTimeout(() => setOpen(false), 200) }, [])

  // fecha com ESC + foca o trigger
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus() }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  // ── MOBILE: drawer ──
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const mobileTriggerRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const toggleExpand = (handle: string) =>
    setExpanded((s) => { const n = new Set(s); n.has(handle) ? n.delete(handle) : n.add(handle); return n })

  // bloqueia scroll do body + ESC fecha + GESTÃO DE FOCO (revisão a11y 04/06):
  // foco entra no drawer ao abrir, Tab cicla dentro (trap), e ao fechar — por
  // qualquer via (ESC/overlay/link/X) — volta pro botão hambúrguer.
  useEffect(() => {
    if (!mobileOpen) return
    const orig = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const focusables = () =>
      drawerRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], select, input, [tabindex]:not([tabindex="-1"])'
      )
    // foco depois do paint (o drawer precisa existir no DOM)
    const raf = requestAnimationFrame(() => focusables()?.[0]?.focus())
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setMobileOpen(false); return }
      if (e.key !== "Tab") return
      const els = focusables()
      if (!els?.length) return
      const first = els[0]
      const last = els[els.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = orig
      document.removeEventListener("keydown", onKey)
      mobileTriggerRef.current?.focus()
    }
  }, [mobileOpen])

  // Fallback: sem categorias, ainda mostra um link pra /store
  if (!categories.length) {
    return (
      <LocalizedClientLink className="hover:text-ui-fg-base" href="/store" data-testid="nav-categorias-link">
        Categorias
      </LocalizedClientLink>
    )
  }

  return (
    <>
      {/* ===== DESKTOP (≥ small) ===== */}
      <div className="hidden small:block relative" onMouseEnter={scheduleOpen} onMouseLeave={scheduleClose}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls="mega-menu-panel"
          onClick={() => { clearTimers(); setOpen((o) => !o) }}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium text-white shadow-md transition-all duration-200
            ${open ? "bg-blue-800 dark:bg-blue-700 shadow-lg" : "bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 hover:shadow-lg"}
            focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2`}
          data-testid="nav-categorias-trigger"
        >
          {/* ícone grade (4 quadradinhos). Quando o menu abre, o SVG inteiro gira
              90° (os 4 quadradinhos parecem se reorganizar). Marco 28/05. */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={`transition-transform duration-300 ease-out ${open ? "rotate-90" : ""}`}
            style={{ transformOrigin: "center" }}
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Categorias
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div
            ref={panelRef}
            id="mega-menu-panel"
            role="menu"
            aria-label="Categorias da loja"
            className="fixed left-0 right-0 top-16 z-40 border-b border-ui-border-base bg-ui-bg-base shadow-xl"
            onMouseEnter={clearTimers}
            onMouseLeave={scheduleClose}
          >
            <div className="content-container py-8">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-8">
                {categories.map((cat) => (
                  <div key={cat.handle} className="min-w-0">
                    <h3 className="mb-3 text-sm font-semibold text-ui-fg-base">
                      {cat.name}{" "}
                      <span className="font-normal text-ui-fg-subtle">({cat.count})</span>
                    </h3>
                    {cat.subs.length > 0 ? (
                      <>
                        <ul className="flex flex-col gap-2">
                          {cat.subs.map((s) => (
                            <li key={s.handle}>
                              <LocalizedClientLink
                                href={`/categories/${s.handle}`}
                                onClick={() => { trackClickCategoria(s.handle, "menu"); setOpen(false) }}
                                className="text-sm text-ui-fg-subtle transition-colors hover:text-[#1251b8] focus:outline-none focus-visible:text-[#1251b8] focus-visible:underline"
                                role="menuitem"
                              >
                                {s.name}{" "}
                                <span className="text-ui-fg-subtle">({s.count})</span>
                              </LocalizedClientLink>
                            </li>
                          ))}
                        </ul>
                        <LocalizedClientLink
                          href={`/categories/${cat.handle}`}
                          onClick={() => { trackClickCategoria(cat.handle, "menu"); setOpen(false) }}
                          className="mt-3 inline-block text-sm font-medium text-[#1251b8] hover:underline"
                          role="menuitem"
                        >
                          Ver tudo →
                        </LocalizedClientLink>
                      </>
                    ) : (
                      <LocalizedClientLink
                        href={`/categories/${cat.handle}`}
                        onClick={() => { trackClickCategoria(cat.handle, "menu"); setOpen(false) }}
                        className="text-sm font-medium text-[#1251b8] hover:underline"
                        role="menuitem"
                      >
                        Ver produtos →
                      </LocalizedClientLink>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== MOBILE (< small) — hamburger + drawer ===== */}
      <button
        ref={mobileTriggerRef}
        type="button"
        aria-label="Abrir menu de categorias"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
        className="small:hidden flex h-10 w-10 items-center justify-center rounded-md text-ui-fg-base hover:bg-ui-bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1251b8]"
        data-testid="nav-hamburger"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 small:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Categorias da loja"
            className="fixed left-0 top-0 z-50 h-full w-[85%] max-w-[360px] bg-ui-bg-base shadow-2xl small:hidden flex flex-col animate-in slide-in-from-left duration-300"
          >
            <div className="flex items-center justify-between border-b border-ui-border-base px-4 py-3">
              <h2 className="text-base font-semibold text-ui-fg-base">Categorias</h2>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-ui-fg-subtle hover:bg-ui-bg-subtle"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto">
              <ul className="px-2 py-2">
                {categories.map((cat) => {
                  const hasSubs = cat.subs.length > 0
                  const isOpen = expanded.has(cat.handle)
                  return (
                    <li key={cat.handle} className="border-b border-ui-border-base last:border-b-0">
                      {hasSubs ? (
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => toggleExpand(cat.handle)}
                          className="flex min-h-[44px] w-full items-center justify-between gap-2 px-3 py-3 text-left text-ui-fg-base"
                        >
                          <span>
                            {cat.name}{" "}
                            <span className="text-ui-fg-subtle">({cat.count})</span>
                          </span>
                          {/* affordance explícita (feedback 10/07: "não estava
                              óbvio que expandia") — rótulo curto + chevron ▾
                              SEMPRE visíveis; ▾ vira ▴ quando aberto */}
                          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-[#1251b8]">
                            {rotuloSubcategorias(cat.subs.map((s) => s.name)).rotuloCurto}
                            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
                              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </button>
                      ) : (
                        <LocalizedClientLink
                          href={`/categories/${cat.handle}`}
                          onClick={() => { trackClickCategoria(cat.handle, "menu"); setMobileOpen(false) }}
                          className="flex min-h-[44px] items-center justify-between px-3 py-3 text-ui-fg-base"
                        >
                          <span>
                            {cat.name}{" "}
                            <span className="text-ui-fg-subtle">({cat.count})</span>
                          </span>
                        </LocalizedClientLink>
                      )}
                      {hasSubs && isOpen && (
                        <ul className="pb-2 pl-6 pr-3">
                          {cat.subs.map((s) => (
                            <li key={s.handle}>
                              <LocalizedClientLink
                                href={`/categories/${s.handle}`}
                                onClick={() => { trackClickCategoria(s.handle, "menu"); setMobileOpen(false) }}
                                className="block py-2 text-sm text-ui-fg-subtle hover:text-[#1251b8]"
                              >
                                {s.name}{" "}
                                <span className="text-ui-fg-subtle">({s.count})</span>
                              </LocalizedClientLink>
                            </li>
                          ))}
                          <li>
                            <LocalizedClientLink
                              href={`/categories/${cat.handle}`}
                              onClick={() => { trackClickCategoria(cat.handle, "menu"); setMobileOpen(false) }}
                              className="block py-2 text-sm font-medium text-[#1251b8]"
                            >
                              Ver tudo →
                            </LocalizedClientLink>
                          </li>
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>

              <div className="border-t border-ui-border-base px-3 py-3">
                <ul className="flex flex-col gap-1">
                  <li><LocalizedClientLink href="/blog" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-ui-fg-subtle">Blog</LocalizedClientLink></li>
                  <li><LocalizedClientLink href="/sobre" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-ui-fg-subtle">Quem somos</LocalizedClientLink></li>
                  <li><LocalizedClientLink href="/account" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-ui-fg-subtle">Minha conta</LocalizedClientLink></li>
                  {/* o toggle de tema saiu do drawer: agora fica ao lado do
                      hambúrguer no topo do header (Marco) */}
                </ul>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  )
}

export default MegaMenuClient
