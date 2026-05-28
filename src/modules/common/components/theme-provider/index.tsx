"use client"

import { ThemeProvider as NextThemeProvider } from "next-themes"

/**
 * Provider de tema (claro/escuro). attribute="class" casa com o darkMode:"class"
 * do Tailwind e com os tokens dark do @medusajs/ui. defaultTheme="system" respeita
 * a preferência do SO do visitante (não dá o "susto" de tela branca em quem usa dark).
 */
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  )
}

export default ThemeProvider
