"use client"

import Script from "next/script"

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
 */
const ATIVO = process.env.NEXT_PUBLIC_GOOGLE_STORE_WIDGET === "true"

const GoogleStoreWidget = () => {
  if (!ATIVO) return null
  return (
    <Script
      id="merchantWidgetScript"
      src="https://www.gstatic.com/shopping/merchant/merchantwidget.js"
      strategy="lazyOnload"
      onLoad={() => {
        try {
          ;(window as any).merchantwidget?.start({
            position: "LEFT_BOTTOM",
            mobileBottomMargin: 96, // acima da barra fixa de checkout do mobile
          })
        } catch {
          /* widget indisponível — sem efeito no resto da página */
        }
      }}
    />
  )
}

export default GoogleStoreWidget
