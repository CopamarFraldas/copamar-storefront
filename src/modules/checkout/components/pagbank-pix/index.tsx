"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@medusajs/ui"
import { createPagbankPix, checkPagbankStatus } from "@lib/data/pagbank"
import { placeOrder } from "@lib/data/cart"
import ErrorMessage from "../error-message"

type Stage = "form" | "qr" | "paid" | "expired"

const formatCpf = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")

// ~15 min de validade do QR (polling a cada 4s → 225 ticks)
const MAX_TICKS = 225

/**
 * Checkout PIX PagBank — UX moderna: CPF → QR + copia-e-cola → polling ao vivo
 * detecta o pagamento automaticamente → finaliza o pedido. Sem botão de "revisão":
 * o próprio painel conduz até a confirmação.
 *
 * Hardening (revisão adversarial): o QR expira (não fica em polling infinito);
 * falhas seguidas de status viram aviso não-bloqueante; e se o placeOrder falhar
 * DEPOIS de pago, o cliente vê o erro + botão pra concluir de novo (nunca trava
 * em "Finalizando…" tendo já pago).
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
  const [warn, setWarn] = useState<string | null>(null)
  const [finalizeError, setFinalizeError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ticksRef = useRef(0)
  const failsRef = useRef(0)

  const cpfDigits = cpf.replace(/\D/g, "")

  // finaliza o pedido; se falhar, mostra erro + permite re-tentar (cliente já pagou)
  async function finalizar() {
    setFinalizeError(null)
    try {
      await placeOrder()
    } catch (e: any) {
      setFinalizeError(
        e?.message || "Não foi possível finalizar o pedido. Tente novamente."
      )
    }
  }

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

  // polling ao vivo do pagamento — com expiração e aviso após falhas seguidas
  useEffect(() => {
    if (stage !== "qr" || !orderId) return
    ticksRef.current = 0
    failsRef.current = 0
    const tick = async () => {
      ticksRef.current += 1
      if (ticksRef.current > MAX_TICKS) {
        if (pollRef.current) clearInterval(pollRef.current)
        setStage("expired")
        return
      }
      try {
        const { paid } = await checkPagbankStatus(orderId)
        failsRef.current = 0
        setWarn(null)
        if (paid) {
          if (pollRef.current) clearInterval(pollRef.current)
          setStage("paid")
          // pequena pausa pra mostrar o "confirmado" e então finaliza
          setTimeout(finalizar, 1200)
        }
      } catch {
        // falha isolada: tenta de novo. Persistente: avisa sem bloquear.
        failsRef.current += 1
        if (failsRef.current >= 5) {
          setWarn(
            "Estamos com dificuldade em confirmar o pagamento automaticamente. Se você já pagou, aguarde — seguimos tentando."
          )
        }
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
        {finalizeError ? (
          <>
            <p className="text-sm text-ui-fg-subtle max-w-sm">
              Recebemos seu pagamento, mas houve um erro ao finalizar o pedido.
              Seu pagamento está seguro — é só concluir de novo.
            </p>
            <ErrorMessage error={finalizeError} />
            <Button onClick={finalizar} className="mt-1">
              Concluir pedido
            </Button>
          </>
        ) : (
          <p className="text-sm text-ui-fg-subtle">Finalizando seu pedido…</p>
        )}
      </div>
    )
  }

  // ── estágio: QR expirado ──
  if (stage === "expired") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-lg font-semibold text-ui-fg-base">QR Code expirado</p>
        <p className="text-sm text-ui-fg-subtle max-w-sm">
          O código PIX expirou. Gere um novo para concluir o pagamento.
        </p>
        <Button
          onClick={() => {
            setError(null)
            setWarn(null)
            setQrText(null)
            setQrImage(null)
            setOrderId(null)
            setStage("form")
          }}
          className="mt-1"
        >
          Gerar novo PIX
        </Button>
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

        {warn && (
          <p className="text-xs text-amber-600 text-center max-w-sm">{warn}</p>
        )}
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
