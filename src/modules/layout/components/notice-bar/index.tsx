"use client"

import { useEffect, useState } from "react"

/**
 * Barra de aviso no topo (item 0 da proposta de home) — canal pra info/promoção
 * sem poluir o hero. Conteúdo atual = fatos REAIS e permanentes (entrega +
 * condições de pagamento), NÃO promoção fabricada. Quando houver campanha, é só
 * trocar o texto aqui. Dispensável (fica fechada pela sessão).
 *
 * CLS: começa VISÍVEL (estado comum = não-dispensada → sem salto). Só some pra
 * quem já fechou nesta sessão (pequeno reflow pra trás, aceitável).
 */
const STORAGE_KEY = "copamar-notice-dismissed-v1"

const NoticeBar = () => {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") setHidden(true)
    } catch {
      /* sem sessionStorage (privado): mantém visível */
    }
  }, [])

  if (hidden) return null

  return (
    <div className="relative bg-copamar-primary text-white text-xs sm:text-sm">
      <div className="content-container flex items-center justify-center gap-x-2 py-2 pr-8 text-center">
        <span aria-hidden>🚚</span>
        <span>
          Entrega para <strong>todo o Brasil</strong> · 3x sem juros ou{" "}
          <strong>5% de desconto no PIX</strong>
        </span>
      </div>
      <button
        type="button"
        aria-label="Fechar aviso"
        onClick={() => {
          setHidden(true)
          try {
            sessionStorage.setItem(STORAGE_KEY, "1")
          } catch {
            /* noop */
          }
        }}
        className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full transition hover:bg-white/20"
      >
        <span className="text-base leading-none">×</span>
      </button>
    </div>
  )
}

export default NoticeBar
