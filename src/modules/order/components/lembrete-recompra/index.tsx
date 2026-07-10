"use client"

import { useEffect, useState } from "react"
import { Text } from "@medusajs/ui"
import { agendarLembreteRecompra } from "@lib/data/lembrete-recompra"

/**
 * "Me lembre de repor" — bloco simpático na confirmação do pedido e no painel
 * do pedido. Fralda é compra RECORRENTE: o cliente escolhe em quantos dias quer
 * o toque, e recebe um WhatsApp com o pedido prontinho (link mágico /recompra)
 * — é só pagar.
 *
 * Botões GRANDES (público 45-65) + "Não, obrigado" que dispensa. A escolha (ou
 * a dispensa) fica no localStorage por pedido, pra não re-perguntar em cada
 * visita. Quem grava no Supabase é a server action (service key server-side).
 * O PAI só renderiza este bloco se o pedido TEM celular.
 */

const OPCOES = [15, 20, 30, 45]

const LembreteRecompra = ({
  orderId,
  displayId,
}: {
  orderId: string
  displayId?: number
}) => {
  const lsKey = `lembrete_recompra_${displayId ?? orderId}`
  // null = ainda perguntando; -1 = dispensado; >0 = dias combinados
  const [escolha, setEscolha] = useState<number | null>(null)
  const [salvando, setSalvando] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [pronto, setPronto] = useState(false) // evita flash antes de ler o localStorage

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(lsKey)
      if (v === "nao") setEscolha(-1)
      else if (v && Number(v) > 0) setEscolha(Number(v))
    } catch {}
    setPronto(true)
  }, [lsKey])

  const lembra = async (dias: number) => {
    setErro(null)
    setSalvando(dias)
    try {
      const r = await agendarLembreteRecompra(orderId, dias)
      if (r.ok) {
        setEscolha(dias)
        try {
          window.localStorage.setItem(lsKey, String(dias))
        } catch {}
      } else {
        setErro(r.erro || "Não conseguimos agendar agora — tente de novo.")
      }
    } catch {
      setErro("Não conseguimos agendar agora — tente de novo em instantes.")
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

  // já combinado (agora ou numa visita anterior)
  if (escolha && escolha > 0) {
    return (
      <div
        className="rounded-large border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-900/40 dark:bg-emerald-900/20"
        data-testid="lembrete-recompra-ok"
      >
        <p className="font-semibold text-emerald-700 dark:text-emerald-300">
          ✅ Combinado! Te lembramos em {escolha} dias.
        </p>
        <p className="mt-0.5 text-sm text-emerald-700/80 dark:text-emerald-300/80">
          Você recebe um WhatsApp com seu pedido prontinho — é só pagar. Se
          mudar de ideia, é só ignorar a mensagem.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-large border border-copamar-primary/30 bg-copamar-primary/5 px-5 py-4"
      data-testid="lembrete-recompra"
    >
      <Text className="txt-medium-plus text-ui-fg-base font-semibold">
        🔔 Quer que a gente te lembre de repor?
      </Text>
      <Text className="text-sm text-ui-fg-subtle mt-1">
        Você recebe um WhatsApp com seu pedido prontinho — é só pagar.
      </Text>
      <div className="mt-3 grid grid-cols-2 gap-2 small:grid-cols-4">
        {OPCOES.map((d) => (
          <button
            key={d}
            type="button"
            disabled={salvando !== null}
            onClick={() => lembra(d)}
            className="rounded-lg border border-copamar-primary/40 bg-white px-4 py-3 text-base font-semibold text-copamar-primary shadow-sm transition hover:bg-copamar-primary hover:text-white disabled:opacity-60 dark:bg-transparent"
            data-testid={`lembrete-${d}-dias`}
          >
            {salvando === d ? "Um instante…" : `Em ${d} dias`}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={dispensa}
        className="mt-1 inline-flex min-h-[44px] items-center px-2 -mx-2 text-sm text-ui-fg-subtle underline underline-offset-2 hover:text-ui-fg-base"
        data-testid="lembrete-nao-obrigado"
      >
        Não, obrigado
      </button>
      {erro && (
        <Text className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          {erro}
        </Text>
      )}
    </div>
  )
}

export default LembreteRecompra
