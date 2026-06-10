"use client"

import { confirmarCelular } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

/**
 * Tela "Confirme seu WhatsApp" do 1º acesso do cliente MIGRADO (Marco 10/06).
 * O site antigo tinha um autocomplete que "comia o último dígito" do celular
 * (341 dos telefones vieram com 10 dígitos). Aqui o cliente confirma/corrige —
 * salva no Medusa e propaga pro Bling (de onde MAPA/notificações leem o número).
 * NÃO-bloqueante: "confirmar depois" navega pra outra aba e some por essa visita.
 */

const soDigitos = (s: string) => s.replace(/\D/g, "").slice(0, 11)

function formata(d: string): string {
  d = soDigitos(d)
  if (d.length <= 2) return d.length ? `(${d}` : ""
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

const ehCelularValido = (d: string) =>
  d.length === 11 && d[2] === "9" && /^[1-9][0-9]/.test(d)

export default function ConfirmarCelular({
  telefoneAtual,
  nome,
}: {
  telefoneAtual: string
  nome?: string
}) {
  const router = useRouter()
  const inicial = soDigitos(telefoneAtual || "")
  const [digitos, setDigitos] = useState(inicial)
  const [state, action, pending] = useActionState(confirmarCelular, "")

  // sucesso → recarrega o /account (agora celular_confirmado=true → mostra a conta)
  useEffect(() => {
    if (state === "OK") router.refresh()
  }, [state, router])

  const valido = ehCelularValido(digitos)
  const naoMexeu = digitos === inicial
  const erroServidor = state && state !== "OK" ? state : ""

  // texto contextual: vazio (captura) · 10 díg c/ 9 (o bug) · 11 (confirma)
  const dica = useMemo(() => {
    if (!inicial) return null
    if (inicial.length === 10 && inicial[2] === "9")
      return "⚠️ Parece faltar 1 número no final — confira e complete."
    return null
  }, [inicial])

  const semNumero = !inicial

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-ui-bg-base px-5 py-10 text-center">
      <div className="flex w-full max-w-md flex-col items-center">
      <span className="text-4xl" aria-hidden>
        📱
      </span>
      <h1 className="mt-3 text-2xl font-bold text-copamar-primary dark:text-ui-fg-base">
        {semNumero ? "Qual é o seu WhatsApp?" : "Confirme seu WhatsApp"}
      </h1>
      <p className="mt-2 text-sm text-ui-fg-subtle">
        {nome ? `${nome}, ` : ""}
        nós trocamos de site 💙 e queremos garantir que seu número está certo —
        é por ele que avisamos sobre o seu pedido e a entrega.
      </p>

      <form
        action={action}
        className="mt-6 flex w-full flex-col gap-3"
      >
        <input type="hidden" name="phone" value={digitos} />
        <label className="text-left text-sm font-medium text-ui-fg-base">
          Seu celular com WhatsApp
        </label>
        <input
          type="tel"
          inputMode="numeric"
          autoFocus
          value={formata(digitos)}
          onChange={(e) => setDigitos(soDigitos(e.target.value))}
          placeholder="(11) 91234-5678"
          className="rounded-xl border border-ui-border-base bg-ui-bg-field px-4 py-3 text-center text-lg font-semibold tracking-wide text-ui-fg-base outline-none focus:border-copamar-primary"
        />

        {dica && !valido && (
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            {dica}
          </p>
        )}
        {erroServidor && (
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
            {erroServidor}
          </p>
        )}

        <button
          type="submit"
          disabled={!valido || pending}
          className="mt-1 rounded-xl bg-copamar-primary px-4 py-3.5 text-base font-semibold text-white transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? "Salvando…"
            : naoMexeu && valido
              ? "Está correto, prosseguir"
              : "Salvar e continuar"}
        </button>
      </form>

      <LocalizedClientLink
        href="/account/profile"
        className="mt-4 text-sm text-ui-fg-subtle underline underline-offset-2 hover:text-ui-fg-base"
      >
        confirmar depois
      </LocalizedClientLink>
      </div>
    </div>
  )
}
