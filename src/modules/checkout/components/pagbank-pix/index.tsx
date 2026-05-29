"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@medusajs/ui"
import { createPagbankPix, checkPagbankStatus } from "@lib/data/pagbank"
import { placeOrder } from "@lib/data/cart"
import ErrorMessage from "../error-message"

type Stage = "form" | "qr" | "paid"

const formatCpf = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")

/**
 * Checkout PIX PagBank — UX moderna: CPF → QR + copia-e-cola → polling ao vivo
 * detecta o pagamento automaticamente → finaliza o pedido. Sem botão de "revisão":
 * o próprio painel conduz até a confirmação.
 */
const PagBankPix = ({ cartId }: { cartId: string }) => {
  const [stage, setStage] = useState<Stage>("form")
  const [cpf, setCpf] = useState("")
  const [qrText, setQrText] = useState<string | null>(null)
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cpfDigits = cpf.replace(/\D/g, "")

  async function gerarPix() {
    setError(null)
    if (cpfDigits.length !== 11) {
      setError("Informe um CPF válido (11 dígitos).")
      return
    }
    setLoading(true)
    try {
      const r = await createPagbankPix(cartId, cpfDigits)
      if (!r.qr_text || !r.order_id) throw new Error("Não foi possível gerar o PIX. Tente novamente.")
      setQrText(r.qr_text)
      setQrImage(r.qr_image)
      setOrderId(r.order_id)
      setStage("qr")
    } catch (e: any) {
      setError(e?.message || "Falha ao gerar o PIX.")
    } finally {
      setLoading(false)
    }
  }

  // polling ao vivo do pagamento
  useEffect(() => {
    if (stage !== "qr" || !orderId) return
    const tick = async () => {
      try {
        const { paid } = await checkPagbankStatus(orderId)
        if (paid) {
          if (pollRef.current) clearInterval(pollRef.current)
          setStage("paid")
          // pequena pausa pra mostrar o "confirmado" e então finaliza (redireciona)
          setTimeout(() => placeOrder().catch((e) => setError(e?.message)), 1200)
        }
      } catch {
        /* silencioso — tenta de novo no próximo tick */
      }
    }
    pollRef.current = setInterval(tick, 4000)
    tick()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [stage, orderId])

  const copiar = async () => {
    if (!qrText) return
    try {
      await navigator.clipboard.writeText(qrText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* navegador sem clipboard API */
    }
  }

  // ── estágio: pago ──
  if (stage === "paid") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-ui-fg-base">Pagamento confirmado! 🎉</p>
        <p className="text-sm text-ui-fg-subtle">Finalizando seu pedido…</p>
      </div>
    )
  }

  // ── estágio: QR + polling ──
  if (stage === "qr") {
    return (
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="rounded-2xl border border-ui-border-base bg-white p-4 shadow-sm">
          {qrImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrImage} alt="QR Code PIX" className="h-56 w-56 object-contain" />
          ) : (
            <div className="h-56 w-56 animate-pulse rounded bg-gray-100" />
          )}
        </div>

        <p className="text-sm text-ui-fg-subtle text-center max-w-sm">
          Abra o app do seu banco, escolha <strong>PIX</strong> e escaneie o QR — ou use o copia-e-cola:
        </p>

        <div className="flex w-full max-w-md items-center gap-2">
          <code className="flex-1 truncate rounded-lg border border-ui-border-base bg-ui-bg-subtle px-3 py-2 text-xs text-ui-fg-subtle">
            {qrText}
          </code>
          <Button variant="secondary" size="small" onClick={copiar}>
            {copied ? "Copiado ✓" : "Copiar"}
          </Button>
        </div>

        <div className="mt-2 flex items-center gap-2 text-sm text-ui-fg-muted">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1251b8] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#1251b8]" />
          </span>
          Aguardando pagamento… (confirma automaticamente)
        </div>

        <ErrorMessage error={error} />
      </div>
    )
  }

  // ── estágio: CPF ──
  return (
    <div className="flex flex-col gap-3 py-2 max-w-md">
      <p className="text-sm text-ui-fg-subtle">
        Pagamento via <strong>PIX</strong> — aprovação na hora. Informe seu CPF pra gerar o código.
      </p>
      <label className="text-sm font-medium text-ui-fg-base">CPF do pagador</label>
      <input
        inputMode="numeric"
        value={cpf}
        onChange={(e) => setCpf(formatCpf(e.target.value))}
        placeholder="000.000.000-00"
        className="rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2 text-ui-fg-base outline-none focus:border-[#1251b8] focus:ring-1 focus:ring-[#1251b8]"
      />
      <ErrorMessage error={error} />
      <Button onClick={gerarPix} isLoading={loading} className="mt-1 w-fit">
        Gerar PIX
      </Button>
    </div>
  )
}

export default PagBankPix
