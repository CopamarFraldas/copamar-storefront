"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

/** Botão claro/escuro. Mostra ícone só após montar (evita mismatch de hidratação). */
const ThemeToggle = () => {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const current = theme === "system" ? resolvedTheme : theme
  const isDark = current === "dark"

  return (
    <button
      type="button"
      // label neutro no SSR (mounted=false) — evita hydration mismatch porque o tema
      // só é conhecido no cliente. Após montar, label reflete o tema real.
      aria-label={!mounted ? "Alternar tema" : isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-8 w-8 items-center justify-center rounded-full text-ui-fg-subtle transition-colors hover:bg-ui-bg-subtle hover:text-ui-fg-base"
    >
      {/* placeholder neutro até montar, pra não pular layout nem dar hydration warning */}
      {!mounted ? (
        <span className="h-5 w-5" />
      ) : isDark ? (
        // sol
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // lua
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

export default ThemeToggle
