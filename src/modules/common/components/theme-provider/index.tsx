"use client"

import { ThemeProvider as NextThemeProvider } from "next-themes"

/**
 * Provider de tema (claro/escuro). attribute="class" casa com o darkMode:"class"
 * do Tailwind e com os tokens dark do @medusajs/ui.
 * Decisão do Marco (07/06): o site SEMPRE abre em modo CLARO — o escuro só
 * entra se a própria pessoa ativar no toggle (a escolha fica salva pra ela).
 * enableSystem=false ignora o prefers-color-scheme do SO.
 */
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  )
}

export default ThemeProvider
