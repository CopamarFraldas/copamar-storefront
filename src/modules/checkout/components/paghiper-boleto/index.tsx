"use client"

import { useState } from "react"
import { Button } from "@medusajs/ui"
import { createPagHiperBoleto } from "@lib/data/paghiper"
import { placeOrder } from "@lib/data/cart"
import { isValidCpfOrCnpj, maskCpfCnpj } from "@lib/util/cpf"
import ErrorMessage from "../error-message"

type Stage = "form" | "boleto"

type Boleto = {
  transaction_id: string | null
  linha_digitavel: string | null
  codigo_barras: string | null
  pdf_url: string | null
  url_slip: string | null
  vencimento: string | null
}

const formatCpf = maskCpfCnpj

// "YYYY-MM-DD" → "DD/MM/YYYY" (sem fuso, só reordena os campos)
function formatVenc(v?: string | null): string | null {
  if (!v) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v
}

/**
 * Checkout BOLETO PagHiper (#52) — 3ª forma de pagamento.
 *
 * Fluxo: CPF/CNPJ (do faturamento) → "Gerar boleto" → mostra linha digitável
 * (copiar), código de barras, PDF/imprimir e vencimento → "Concluir pedido"
 * cria o pedido ("aguardando pagamento", EMAIL 1 do #51). Boleto é pago depois
 * (banco/lotérica/app); a confirmação chega via webhook/cron → EMAIL 2.
 *
 * Diferente do PIX: SEM polling ao vivo (boleto compensa em 1-2 dias úteis).
 */
const PagHiperBoleto = ({
  cartId,
  fiscalDoc,
}: {
  cartId: string
  fiscalDoc?: string
}) => {
  const fiscalDigits = (fiscalDoc || "").replace(/\D/g, "")
  const hasFiscal = isValidCpfOrCnpj(fiscalDigits)

  const [stage, setStage] = useState<Stage>("form")
  const [cpf, setCpf] = useState("")
  const [boleto, setBoleto] = useState<Boleto | null>(null)
  const [loading, setLoading] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finalizeError, setFinalizeError] = useState<string | null>(null)

  const cpfDigits = cpf.replace(/\D/g, "")

  async function gerarBoleto() {
    if (loading) return // anti double-submit
    setError(null)
    const docToUse = hasFiscal ? fiscalDigits : cpfDigits
    if (!isValidCpfOrCnpj(docToUse)) {
      setError("Informe um CPF ou CNPJ válido.")
      return
    }
    setLoading(true)
    try {
      const r = await createPagHiperBoleto(cartId, docToUse)
      if (!r.linha_digitavel || !r.transaction_id) {
        throw new Error("Não foi possível gerar o boleto. Tente novamente.")
      }
      setBoleto(r)
      setStage("boleto")
    } catch (e: any) {
      setError(e?.message || "Falha ao gerar o boleto.")
    } finally {
      setLoading(false)
    }
  }

  async function concluir() {
    if (finalizing) return
    setFinalizing(true)
    setFinalizeError(null)
    try {
      await placeOrder()
    } catch (e: any) {
      setFinalizeError(
        e?.message || "Não foi possível concluir o pedido. Tente novamente."
      )
      setFinalizing(false)
    }
  }

  const copiar = async () => {
    if (!boleto?.linha_digitavel) return
    try {
      await navigator.clipboard.writeText(boleto.linha_digitavel)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* navegador sem clipboard API */
    }
  }

  // ── estágio: boleto emitido ──
  if (stage === "boleto" && boleto) {
    const venc = formatVenc(boleto.vencimento)
    return (
      <div className="flex flex-col gap-4 py-2 max-w-lg">
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-300">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Boleto gerado! {venc && <span>Vence em <strong>{venc}</strong>.</span>}
        </div>

        {/* linha digitável + copiar */}
        <div>
          <label className="text-sm font-medium text-ui-fg-base">Linha digitável</label>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg border border-ui-border-base bg-ui-bg-subtle px-3 py-2 text-xs text-ui-fg-base">
              {boleto.linha_digitavel}
            </code>
            <Button variant="secondary" size="small" onClick={copiar}>
              {copied ? "Copiado ✓" : "Copiar"}
            </Button>
          </div>
        </div>

        {/* código de barras (número) */}
        {boleto.codigo_barras && (
          <div>
            <label className="text-sm font-medium text-ui-fg-base">Código de barras</label>
            <code className="mt-1 block break-all rounded-lg border border-ui-border-base bg-ui-bg-subtle px-3 py-2 text-xs text-ui-fg-subtle">
              {boleto.codigo_barras}
            </code>
          </div>
        )}

        {/* PDF / imprimir */}
        <div className="flex flex-wrap gap-2">
          {boleto.pdf_url && (
            <a href={boleto.pdf_url} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="small">
                ⬇ Baixar PDF
              </Button>
            </a>
          )}
          {boleto.url_slip && (
            <a href={boleto.url_slip} target="_blank" rel="noopener noreferrer">
              <Button variant="transparent" size="small">
                🖨 Imprimir / abrir boleto
              </Button>
            </a>
          )}
        </div>

        <p className="rounded-lg bg-ui-bg-subtle px-3 py-2 text-sm text-ui-fg-subtle">
          Pague em qualquer <strong>banco, lotérica</strong> ou no <strong>app do seu banco</strong>.
          A confirmação do pagamento leva de <strong>1 a 2 dias úteis</strong> — assim que cair,
          avisamos por e-mail. <strong>Guarde ou baixe o boleto</strong> antes de concluir.
        </p>

        {finalizeError && <ErrorMessage error={finalizeError} />}

        <Button onClick={concluir} isLoading={finalizing} size="large" className="w-full">
          Concluir pedido →
        </Button>
      </div>
    )
  }

  // ── estágio inicial: já temos o documento de faturamento ──
  if (hasFiscal) {
    return (
      <div className="flex flex-col gap-3 py-2 max-w-md">
        <p className="text-sm text-ui-fg-subtle">
          Pagamento via <strong>boleto bancário</strong>. Geramos o boleto na hora —
          você paga em banco, lotérica ou app, e o pedido fica reservado aguardando o pagamento.
        </p>
        <p className="text-xs text-ui-fg-subtle">
          Identificação:{" "}
          <strong className="text-ui-fg-subtle">{formatCpf(fiscalDigits)}</strong>{" "}
          (documento do faturamento)
        </p>
        <ErrorMessage error={error} />
        <Button onClick={gerarBoleto} isLoading={loading} className="mt-1 w-fit">
          Gerar boleto
        </Button>
      </div>
    )
  }

  // ── fallback: documento de faturamento ausente → pede aqui ──
  return (
    <div className="flex flex-col gap-3 py-2 max-w-md">
      <p className="text-sm text-ui-fg-subtle">
        Pagamento via <strong>boleto bancário</strong>. Informe seu CPF ou CNPJ pra gerar o boleto.
      </p>
      <label className="text-sm font-medium text-ui-fg-base">CPF ou CNPJ</label>
      <input
        inputMode="numeric"
        value={cpf}
        onChange={(e) => setCpf(formatCpf(e.target.value))}
        placeholder="CPF ou CNPJ"
        className="rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2 text-ui-fg-base outline-none focus:border-[#1251b8] focus:ring-1 focus:ring-[#1251b8]"
      />
      <ErrorMessage error={error} />
      <Button onClick={gerarBoleto} isLoading={loading} className="mt-1 w-fit">
        Gerar boleto
      </Button>
    </div>
  )
}

export default PagHiperBoleto
