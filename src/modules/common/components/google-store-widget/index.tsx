"use client"

import Script from "next/script"
import { useEffect } from "react"

/**
 * Widget OFICIAL do Google ("store widget", ex-badge do Google Customer
 * Reviews, #42) — flutuante, servido e ATUALIZADO pelo próprio Google com o
 * seller rating real da loja (Merchant Center 122803740).
 *
 * DESLIGADO por padrão (NEXT_PUBLIC_GOOGLE_STORE_WIDGET !== "true") porque:
 *  1. exige um passo do MARCO no Merchant Center: ativar/aceitar o programa
 *     "Avaliações de clientes do Google" (Qualidade da loja) — sem isso o
 *     widget não renderiza;
 *  2. é um float de canto — fixado em LEFT_BOTTOM pra NUNCA brigar com o
 *     botão de WhatsApp (direita), e o Google proíbe cobri-lo com conteúdo.
 *
 * Quando o Marco ativar no Merchant: NEXT_PUBLIC_GOOGLE_STORE_WIDGET=true e
 * pronto. Doc: support.google.com/merchants/answer/14632921
 *
 * ⚠️ O script do Google appenda o badge direto no <body> (fora do React), então
 * ele SOBREVIVE à navegação client-side pra fora do layout principal — vazava
 * pro checkout (que tem layout próprio) e cobria conteúdo no mobile (bloco de
 * benefícios da PDP + barra fixa de compra). Controle (09/06):
 *  - stylesheet PERSISTENTE injetado no <head> (precisa valer mesmo com este
 *    componente desmontado, i.e. dentro do checkout);
 *  - classe `gsw-hide` no <html> quando saímos do layout principal (cleanup do
 *    effect) → badge some no checkout; remount ao voltar → reaparece;
 *  - mobile (< small/1024px): só aparece DEPOIS de rolar a página (primeira
 *    dobra limpa) e reduzido (scale .8) pra não cobrir o conteúdo da PDP.
 */
const ATIVO = process.env.NEXT_PUBLIC_GOOGLE_STORE_WIDGET === "true"

// container que o merchantwidget.js cria no <body> (estilos inline do Google)
const WRAPPER_SEL = "#google-merchantwidget-iframe-wrapper"
const STYLE_ID = "gsw-ctrl-style"
const HIDE_CLASS = "gsw-hide" // fora do layout principal (ex.: checkout)
const MOB_WAIT_CLASS = "gsw-mob-wait" // mobile antes do scroll
const SCROLL_MIN = 480 // px rolados antes do badge aparecer no mobile

// display:none em stylesheet com !important vence o style inline do Google
// (que só usa !important em bottom/left, não em display)
const CSS = `
html.${HIDE_CLASS} ${WRAPPER_SEL}{display:none !important;}
@media (max-width: 1023px){
  ${WRAPPER_SEL}{transform:scale(.8);transform-origin:bottom left;}
  html.${MOB_WAIT_CLASS} ${WRAPPER_SEL}{display:none !important;}
}
`

const GoogleStoreWidget = () => {
  useEffect(() => {
    if (!ATIVO) {
      return
    }
    const html = document.documentElement
    if (!document.getElementById(STYLE_ID)) {
      const st = document.createElement("style")
      st.id = STYLE_ID
      st.textContent = CSS
      document.head.appendChild(st)
    }
    html.classList.remove(HIDE_CLASS) // montou no layout principal → pode aparecer
    const onScroll = () => {
      html.classList.toggle(MOB_WAIT_CLASS, window.scrollY < SCROLL_MIN)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      // saiu do layout principal (checkout tem layout próprio) → esconder o
      // badge, que continua vivo no <body>
      html.classList.add(HIDE_CLASS)
    }
  }, [])

  if (!ATIVO) return null
  return (
    <Script
      id="merchantWidgetScript"
      src="https://www.gstatic.com/shopping/merchant/merchantwidget.js"
      strategy="lazyOnload"
      onLoad={() => {
        try {
          ;(window as any).merchantwidget?.start({
            merchant_id: 122803740, // Merchant Center Copamar (programa ativado 05/06)
            region: "BR",
            position: "LEFT_BOTTOM", // canto esquerdo — longe do WhatsApp (direita)
            mobileBottomMargin: 140, // limpa a barra fixa de compra do mobile (~125px; 96 sobrepunha)
          })
        } catch {
          /* widget indisponível — sem efeito no resto da página */
        }
      }}
    />
  )
}

export default GoogleStoreWidget
