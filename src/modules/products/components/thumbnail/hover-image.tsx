"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

/**
 * Camada de imagem que faz crossfade no HOVER do card (imagem[0] → imagem[1]).
 * - Só renderiza em dispositivos com hover real (desktop) — em mobile/touch
 *   NÃO renderiza, então não há efeito no toque NEM download extra (perf).
 * - Fica sobre a imagem base (absolute), opacity-0 → 100 no group-hover, 300ms.
 * - Next/Image lazy: a 2ª imagem carrega quando o card entra no viewport
 *   (antes do hover), evitando o "piscar" na 1ª passada do mouse.
 * Requer que o card pai tenha a classe `group` (já tem no product-preview).
 */
const HoverImage = ({ src }: { src: string }) => {
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    setCanHover(window.matchMedia?.("(hover: hover)").matches ?? false)
  }, [])

  if (!canHover) return null

  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      fill
      draggable={false}
      quality={50}
      sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
      className="absolute inset-0 object-contain object-center p-2 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 will-change-[opacity]"
    />
  )
}

export default HoverImage
