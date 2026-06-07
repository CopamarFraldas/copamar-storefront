"use client"

import { useState } from "react"
import { Button } from "@medusajs/ui"

/**
 * Re-exibe o BOLETO na confirmação do pedido (Marco 04/06): quem fechou com
 * boleto precisa pagá-lo — então a linha digitável + PDF ficam à mão aqui,
 * sem depender do e-mail. Os dados vêm de payment.data (gravados pelo provider).
 */
type BoletoBoxProps = {
  linhaDigitavel: string
  pdfUrl?: string | null
  urlSlip?: string | null
  vencimento?: string | null
  /** referência humana mostrada no boleto/e-mails da PagHiper (CPM-XXXXXX) */
  referencia?: string | null
}

function formatVenc(v?: string | null): string | null {
  if (!v) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v
}

const BoletoBox = ({ linhaDigitavel, pdfUrl, urlSlip, vencimento, referencia }: BoletoBoxProps) => {
  const [copied, setCopied] = useState(false)
  const venc = formatVenc(vencimento)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(linhaDigitavel)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* navegador sem clipboard API */
    }
  }

  return (
    <div
      className="rounded-xl border border-copamar-primary/30 bg-copamar-primary/5 p-4 flex flex-col gap-3"
      data-testid="boleto-box"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ui-fg-base">
          Seu boleto
          {referencia && (
            <span className="ml-2 font-normal text-ui-fg-subtle">
              ref. {referencia}
            </span>
          )}
        </p>
        {venc && (
          <span className="text-xs font-medium text-copamar-primary">
            vence em {venc}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <code className="flex-1 break-all rounded-lg border border-ui-border-base bg-ui-bg-base px-3 py-2 text-xs text-ui-fg-base">
          {linhaDigitavel}
        </code>
        <Button variant="secondary" size="small" onClick={copiar}>
          {copied ? "Copiado ✓" : "Copiar"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {pdfUrl && (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <Button size="small">⬇ Baixar boleto (PDF)</Button>
          </a>
        )}
        {urlSlip && (
          <a href={urlSlip} target="_blank" rel="noopener noreferrer">
            <Button variant="transparent" size="small">🖨 Abrir / imprimir</Button>
          </a>
        )}
      </div>

      <p className="text-xs text-ui-fg-subtle">
        Pague em qualquer banco, lotérica ou pelo app do seu banco. Assim que o
        pagamento cair (1–2 dias úteis), avisamos por e-mail e preparamos seu envio.
      </p>
    </div>
  )
}

export default BoletoBox
