"use client"

import type React from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  OrigemClickCategoria,
  trackClickCategoria,
} from "@lib/util/categorias"

/**
 * Link de categoria que dispara click_categoria no pipeline copamar-track
 * (eventos_comportamento) SEM bloquear a navegação — o script enfileira e
 * envia em batch; a navegação client-side do Next segue na hora.
 * Usado pela régua de chips (origem "chips") e pela faixa de subcategorias
 * da página de categoria (origem "faixa-categoria"). O mega-menu, que já é
 * client component, chama trackClickCategoria direto.
 */
const CategoriaTrackLink = ({
  handle,
  origem,
  onClick,
  children,
  ...props
}: {
  handle: string
  origem: OrigemClickCategoria
  href: string
  className?: string
  onClick?: () => void
  children?: React.ReactNode
  [x: string]: any
}) => {
  return (
    <LocalizedClientLink
      {...props}
      onClick={() => {
        trackClickCategoria(handle, origem)
        onClick?.()
      }}
    >
      {children}
    </LocalizedClientLink>
  )
}

export default CategoriaTrackLink
