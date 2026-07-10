"use client"

import { useEffect, useState } from "react"
import { Text } from "@medusajs/ui"
import { aderirEntregaProgramada } from "@lib/data/entrega-programada"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * "📦 Entrega Programada" — bloco na confirmação do pedido e no painel do
 * pedido, LOGO ABAIXO do "Me lembre de repor" (que é 1x; este é RECORRENTE).
 * O cliente transforma o pedido em entrega a cada 2/3/4/6 semanas e ganha 5%
 * em TODA entrega, em qualquer forma de pagamento. Sem cartão guardado: a cada
 * ciclo chega um WhatsApp com o pedido pronto — é só pagar. Pular, pausar ou
 * cancelar quando quiser, no painel ou pelo WhatsApp.
 *
 * Botões GRANDES (público 45-65) + "Agora não" que dispensa. A escolha (ou a
 * dispensa) fica no localStorage por pedido, pra não re-perguntar em cada
 * visita. Quem grava no Supabase é a server action (service key server-side).
 * O PAI só renderiza este bloco se o pedido TEM celular E a flag
 * copamar_kv 'entrega_programada' está ON (fail-closed).
 */

const OPCOES = [2, 3, 4, 6]

const EntregaProgramada = ({
  orderId,
  displayId,
}: {
  orderId: string
  displayId?: number
}) => {
  const lsKey = `entrega_programada_${displayId ?? orderId}`
  // null = ainda perguntando; -1 = dispensado; >0 = semanas combinadas
  const [escolha, setEscolha] = useState<number | null>(null)
  const [salvando, setSalvando] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [pronto, setPronto] = useState(false) // evita flash antes do localStorage

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(lsKey)
      if (v === "nao") setEscolha(-1)
      else if (v && Number(v) > 0) setEscolha(Number(v))
    } catch {}
    setPronto(true)
  }, [lsKey])

  const programa = async (semanas: number) => {
    setErro(null)
    setSalvando(semanas)
    try {
      const r = await aderirEntregaProgramada(orderId, semanas)
      if (r.ok) {
        setEscolha(semanas)
        try {
          window.localStorage.setItem(lsKey, String(semanas))
        } catch {}
      } else {
        setErro(r.erro || "Não conseguimos programar agora — tente de novo.")
      }
    } catch {
      setErro("Não conseguimos programar agora — tente de novo em instantes.")
    } finally {
      setSalvando(null)
    }
  }

  const dispensa = () => {
    setEscolha(-1)
    try {
      window.localStorage.setItem(lsKey, "nao")
    } catch {}
  }

  if (!pronto || escolha === -1) return null

  // já programado (agora ou numa visita anterior)
  if (escolha && escolha > 0) {
    return (
      <div
        className="rounded-large border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-900/40 dark:bg-emerald-900/20"
        data-testid="entrega-programada-ok"
      >
        <p className="font-semibold text-emerald-700 dark:text-emerald-300">
          📦 Entrega programada a cada {escolha} semanas — com 5% de desconto!
        </p>
        <p className="mt-0.5 text-sm text-emerald-700/80 dark:text-emerald-300/80">
          Quando chegar a data, você recebe um WhatsApp com o pedido prontinho
          e o desconto já aplicado — é só pagar, do jeito que preferir. Pular,
          pausar ou cancelar é 1 toque em{" "}
          <LocalizedClientLink
            href="/account"
            className="font-semibold underline underline-offset-2"
          >
            Minha conta
          </LocalizedClientLink>
          .
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-large border border-emerald-300 bg-emerald-50/60 px-5 py-4 dark:border-emerald-900/40 dark:bg-emerald-900/10"
      data-testid="entrega-programada"
    >
      <Text className="txt-medium-plus text-ui-fg-base font-semibold">
        📦 Entrega Programada — 5% de desconto em TODA entrega
      </Text>
      <Text className="text-sm text-ui-fg-subtle mt-1">
        Receba este pedido automaticamente, no seu ritmo, com{" "}
        <strong>5% de desconto em qualquer forma de pagamento</strong>. Sem
        cartão guardado: a cada entrega chega um WhatsApp com o pedido pronto —
        você só paga se quiser. Pular, pausar ou cancelar quando quiser.
      </Text>
      <div className="mt-3 grid grid-cols-2 gap-2 small:grid-cols-4">
        {OPCOES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={salvando !== null}
            onClick={() => programa(s)}
            className="rounded-lg border border-emerald-500/50 bg-white px-4 py-3 text-base font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-600 hover:text-white disabled:opacity-60 dark:bg-transparent dark:text-emerald-300"
            data-testid={`entrega-programada-${s}-semanas`}
          >
            {salvando === s ? "Um instante…" : `A cada ${s} semanas`}
          </button>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-4">
        <button
          type="button"
          onClick={dispensa}
          className="inline-flex min-h-[44px] items-center px-2 -mx-2 text-sm text-ui-fg-subtle underline underline-offset-2 hover:text-ui-fg-base"
          data-testid="entrega-programada-agora-nao"
        >
          Agora não
        </button>
        <LocalizedClientLink
          href="/entrega-programada"
          className="inline-flex min-h-[44px] items-center text-sm font-semibold text-emerald-700 underline underline-offset-2 dark:text-emerald-300"
        >
          Como funciona
        </LocalizedClientLink>
      </div>
      {erro && (
        <Text className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          {erro}
        </Text>
      )}
    </div>
  )
}

export default EntregaProgramada
