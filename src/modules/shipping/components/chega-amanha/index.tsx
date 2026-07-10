"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Promessa "🚚 Chega AMANHÃ se você pedir até as Xh" — aparece na PDP (junto do
 * consultor de frete) e na página do carrinho quando o CEP do cliente está na
 * zona de entrega de amanhã.
 *
 * REGRAS (espelham a lógica do FreeShippingBar / regra do Marco):
 * - fonte do CEP = a MESMA do FreteCep: localStorage "copamar_cep" (com
 *   fallback opcional no CEP do cart, prop cepConhecido, como na barra de
 *   frete grátis). Sem CEP conhecido → não mostra NADA (o widget de CEP já
 *   convida a preencher).
 * - só existe o POSITIVO: fora da zona / depois do cutoff / feature desligada /
 *   falha da API → silêncio total (nunca "não chega amanhã").
 * - o CORTE é calculado no SERVIDOR (/store/chega-amanha já responde false
 *   após o cutoff). Aqui NÃO se refaz conta de horário — só exibe. Em
 *   compensação, re-consulta: ao trocar o CEP (evento "copamar:cep" do
 *   FreteCep + "storage" entre abas) e a cada ~5min com a aba visível, porque
 *   o toggle do admin e o horário viram ao longo do dia.
 */

const CEP_KEY = "copamar_cep" // mesma chave do FreteCep — fonte única do CEP
const POLL_MS = 5 * 60 * 1000 // ~5min: pega virada de cutoff e toggle do admin
const MIN_GAP_MS = 30 * 1000 // anti-repique (visibilitychange + interval juntos)

type Resposta = { chega_amanha?: boolean; cutoff_hora?: number | null }

export default function ChegaAmanha({
  cepConhecido,
  className = "",
}: {
  /** CEP vindo do cart (página do carrinho); sem ele, usa o localStorage */
  cepConhecido?: string | null
  className?: string
}) {
  const [res, setRes] = useState<Resposta | null>(null)
  const cepRef = useRef("") // último CEP consultado
  const lastRef = useRef(0) // timestamp da última consulta
  const reqRef = useRef(0) // descarta resposta atrasada de consulta antiga

  const lerCep = useCallback(() => {
    let cep = ""
    try {
      cep = (localStorage.getItem(CEP_KEY) || "").replace(/\D/g, "")
    } catch {
      /* sem storage */
    }
    if (cep.length !== 8) {
      cep = (cepConhecido || "").replace(/\D/g, "")
    }
    return cep.length === 8 ? cep : ""
  }, [cepConhecido])

  const consultar = useCallback(
    async (force = false) => {
      const cep = lerCep()
      if (!cep) {
        // sem CEP conhecido → sem promessa (o widget de CEP convida a preencher)
        cepRef.current = ""
        setRes(null)
        return
      }
      const trocou = cep !== cepRef.current
      if (!force && !trocou && Date.now() - lastRef.current < MIN_GAP_MS) return
      cepRef.current = cep
      lastRef.current = Date.now()
      const id = ++reqRef.current
      try {
        const r = await fetch(`/api/chega-amanha?cep=${cep}`, {
          cache: "no-store",
        })
        const d = r.ok ? await r.json() : null
        if (id === reqRef.current) setRes(d)
      } catch {
        if (id === reqRef.current) setRes(null) // falha da API → silêncio
      }
    },
    [lerCep]
  )

  useEffect(() => {
    consultar(true)
    // CEP trocou na MESMA aba (FreteCep avisa) ou em OUTRA aba (storage)
    const onCep = () => consultar(true)
    const onStorage = (e: StorageEvent) => {
      if (e.key === CEP_KEY) consultar(true)
    }
    // aba voltou a ficar visível → revalida (respeitando o anti-repique)
    const onVisible = () => {
      if (document.visibilityState === "visible") consultar()
    }
    // poll leve: o cutoff vira no servidor e o toggle muda ao longo do dia
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") consultar()
    }, POLL_MS)
    window.addEventListener("copamar:cep", onCep)
    window.addEventListener("storage", onStorage)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(timer)
      window.removeEventListener("copamar:cep", onCep)
      window.removeEventListener("storage", onStorage)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [consultar])

  if (!res || res.chega_amanha !== true) return null

  // "13" → "13h" · "12.5" → "12h30" (defensivo, caso o cutoff venha quebrado)
  const cutoff =
    typeof res.cutoff_hora === "number" && isFinite(res.cutoff_hora)
      ? (() => {
          const h = Math.floor(res.cutoff_hora as number)
          const m = Math.round(((res.cutoff_hora as number) - h) * 60)
          return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`
        })()
      : null

  return (
    <p
      className={`flex items-center gap-x-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 ${className}`}
      data-testid="chega-amanha"
    >
      <span aria-hidden className="text-base">
        🚚
      </span>
      <span>
        Chega <strong>AMANHÃ</strong>
        {cutoff !== null
          ? ` se você pedir até as ${cutoff}`
          : " se você pedir agora"}
      </span>
    </p>
  )
}
