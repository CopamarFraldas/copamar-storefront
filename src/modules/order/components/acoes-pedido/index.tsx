"use client"

import { useState } from "react"
import { Button, Text } from "@medusajs/ui"
import { reorderOrder } from "@modules/account/actions"
import { getNfeLink } from "@lib/data/pedido-painel"

/**
 * Ações do pedido (Marco 18/06) — na página do pedido:
 *  - Repetir este pedido (recompra 1-clique; fralda é recorrente)
 *  - Baixar a nota fiscal (DANFE do Bling, lazy — busca só ao clicar)
 *  - Falar no WhatsApp sobre este pedido (deep-link com o nº pra a MAPA)
 */
const WHATS = "551141190201"

const AcoesPedido = ({
  orderId,
  displayId,
  countryCode = "br",
}: {
  orderId: string
  displayId?: number
  countryCode?: string
}) => {
  const [nfLoading, setNfLoading] = useState(false)
  const [nfMsg, setNfMsg] = useState<string | null>(null)

  const baixarNf = async () => {
    setNfMsg(null)
    setNfLoading(true)
    // pré-abre a aba DENTRO do gesto do clique — se eu abrisse só DEPOIS do await,
    // o popup-blocker bloqueia (Safari/iOS sempre, Chrome mobile frequente) e a NF
    // não abre. Aponto a URL quando ela chega; se o popup foi bloqueado, navego na
    // mesma aba como fallback.
    const win = window.open("", "_blank", "noopener,noreferrer")
    try {
      const url = await getNfeLink(orderId)
      if (url) {
        if (win) win.location.href = url
        else window.location.href = url
      } else {
        win?.close()
        setNfMsg(
          "A nota fiscal deste pedido ainda não está disponível. Assim que for emitida, ela aparece aqui."
        )
      }
    } catch {
      win?.close()
      setNfMsg("Não consegui abrir a nota agora. Tente de novo em instantes.")
    } finally {
      setNfLoading(false)
    }
  }

  const wpp = `https://wa.me/${WHATS}?text=${encodeURIComponent(
    `Olá! Tenho uma dúvida sobre o meu pedido #${displayId ?? ""}.`
  )}`

  return (
    <div className="bg-ui-bg-base rounded-lg border border-ui-border-base p-5">
      <Text className="txt-medium-plus text-ui-fg-base mb-3">
        O que você pode fazer
      </Text>
      <div className="flex flex-col gap-2 small:flex-row small:flex-wrap">
        <form action={reorderOrder} className="w-full small:w-auto">
          <input type="hidden" name="order_id" value={orderId} />
          <input type="hidden" name="countryCode" value={countryCode} />
          <Button type="submit" variant="primary" className="w-full small:w-auto">
            🔁 Repetir este pedido
          </Button>
        </form>

        <Button
          type="button"
          variant="secondary"
          isLoading={nfLoading}
          onClick={baixarNf}
          className="w-full small:w-auto"
        >
          🧾 Baixar nota fiscal
        </Button>

        <a
          href={wpp}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full small:w-auto"
        >
          <Button type="button" variant="secondary" className="w-full small:w-auto">
            💬 Falar sobre este pedido
          </Button>
        </a>
      </div>
      {nfMsg && (
        <Text className="text-sm text-ui-fg-subtle mt-2">{nfMsg}</Text>
      )}
    </div>
  )
}

export default AcoesPedido
