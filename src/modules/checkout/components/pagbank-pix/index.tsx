"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@medusajs/ui"
import { createPagbankPix, checkPagbankStatus } from "@lib/data/pagbank"
import { placeOrder } from "@lib/data/cart"
import { validarEstoqueCarrinho } from "@lib/data/estoque"
import { isValidCpfOrCnpj, maskCpfCnpj } from "@lib/util/cpf"
import ErrorMessage from "../error-message"

type Stage = "form" | "qr" | "paid" | "expired"

const formatCpf = maskCpfCnpj // CPF (11) ou CNPJ (14) — máscara dinâmica

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
const PagBankPix = ({
  cartId,
  fiscalDoc,
  sessionData,
}: {
  cartId: string
  fiscalDoc?: string
  /** data da payment session PagBank ativa — rehidrata o QR pós-refresh */
  sessionData?: Record<string, any>
}) => {
  // Documento do FATURAMENTO (CPF/CNPJ informado na identificação). O PIX é pago
  // por quem escaneia o QR, mas o pedido PagBank precisa de um documento — usamos
  // o de faturamento (não reperguntamos). Fallback: se não veio (carrinho antigo
  // ou acesso direto), volta a pedir o documento.
  const fiscalDigits = (fiscalDoc || "").replace(/\D/g, "")
  const hasFiscal = isValidCpfOrCnpj(fiscalDigits)

  // REHIDRATAÇÃO pós-refresh (bug 10/07): se a sessão PagBank ativa é de PIX
  // (sem data.method === "card") e o QR JÁ foi gerado (qr_text na sessão),
  // reabre direto no estágio do QR — mesmo código, mesmo total, polling
  // religado — em vez de voltar pro formulário "Gerar PIX". Recarregar a
  // página nunca pode mudar o pagamento. NÃO cria sessão nova no mount: só lê
  // a que já existe.
  const qrSessao =
    sessionData &&
    sessionData.method !== "card" &&
    sessionData.qr_text &&
    sessionData.pagbank_order_id // sem order_id o polling não anda → form
      ? sessionData
      : null
  const [stage, setStage] = useState<Stage>(qrSessao ? "qr" : "form")
  const [cpf, setCpf] = useState("")
  const [qrText, setQrText] = useState<string | null>(qrSessao?.qr_text ?? null)
  const [qrImage, setQrImage] = useState<string | null>(
    qrSessao?.qr_image ?? null
  )
  const [orderId, setOrderId] = useState<string | null>(
    qrSessao?.pagbank_order_id ?? null
  )
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warn, setWarn] = useState<string | null>(null)
  const [finalizeError, setFinalizeError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const gerandoRef = useRef(false) // trava síncrona anti double-submit
  const ticksRef = useRef(0)
  const failsRef = useRef(0)

  const cpfDigits = cpf.replace(/\D/g, "")

  // finaliza o pedido; se falhar, mostra erro + permite re-tentar (cliente já pagou)
  async function finalizar() {
    setFinalizeError(null)
    try {
      await placeOrder()
    } catch (e: any) {
      // NEXT_REDIRECT = sucesso: o placeOrder navega via redirect() do Next.
      // Re-lança pra o Next concluir a navegação (mesmo padrão do boleto) — sem
      // isso o digest pintava de vermelho na tela antes de redirecionar.
      if (
        String(e?.message || "").includes("NEXT_REDIRECT") ||
        e?.digest?.includes?.("NEXT_REDIRECT")
      ) {
        throw e
      }
      setFinalizeError(
        e?.message || "Não foi possível finalizar o pedido. Tente novamente."
      )
    }
  }

  async function gerarPix() {
    if (loading) return // guard anti double-submit
    setError(null)
    const docToUse = hasFiscal ? fiscalDigits : cpfDigits
    if (!isValidCpfOrCnpj(docToUse)) {
      setError("Informe um CPF ou CNPJ válido.")
      return
    }
    // trava SÍNCRONA (review 06/06): `loading` é closure do render — 2 cliques
    // no mesmo tick passariam ambos e gerariam 2 cobranças PIX
    if (gerandoRef.current) return
    gerandoRef.current = true
    setLoading(true)
    try {
      // gate anti-oversell (#46): saldo FRESCO antes de gerar o QR — depois
      // que o cliente paga o PIX, não dá mais pra voltar atrás
      const estoque = await validarEstoqueCarrinho()
      if (!estoque.ok) {
        setError(estoque.mensagem)
        return
      }
      const r = await createPagbankPix(cartId, docToUse)
      if (!r.qr_text || !r.order_id) throw new Error("Não foi possível gerar o PIX. Tente novamente.")
      setQrText(r.qr_text)
      setQrImage(r.qr_image)
      setOrderId(r.order_id)
      setStage("qr")
    } catch (e: any) {
      setError(e?.message || "Falha ao gerar o PIX.")
    } finally {
      gerandoRef.current = false
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
        const { paid } = await checkPagbankStatus(cartId)
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

  // Trava o cupom enquanto o PIX está em andamento. Mexer no carrinho (remover/
  // aplicar cupom) DEPOIS do QR gerado muda o total e APAGA a sessão de pagamento
  // → o PIX cai mas o pedido não fecha (incidente 29/06). O DiscountCode lê este
  // flag e bloqueia alterações enquanto o QR está na tela (qr) ou pagando (paid).
  useEffect(() => {
    if (typeof window === "undefined") return
    const KEY = "copamar_pix_qr_ativo"
    if (stage === "qr" || stage === "paid") {
      window.sessionStorage.setItem(KEY, "1")
    } else {
      window.sessionStorage.removeItem(KEY)
    }
    window.dispatchEvent(new Event("copamar-pix-qr"))
    return () => {
      window.sessionStorage.removeItem(KEY)
      window.dispatchEvent(new Event("copamar-pix-qr"))
    }
  }, [stage])

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

        <div className="mt-2 flex items-center gap-2 text-sm text-ui-fg-subtle">
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

  // ── estágio inicial ──
  // Caminho normal: já temos o documento de faturamento → só gerar o QR.
  if (hasFiscal) {
    return (
      <div className="flex flex-col gap-3 py-2 max-w-md">
        <p className="text-sm text-ui-fg-subtle">
          Pagamento via <strong>PIX</strong> — aprovação na hora. É só gerar o
          código e pagar pelo app do seu banco.
        </p>
        <p className="text-xs text-ui-fg-subtle">
          Identificação:{" "}
          <strong className="text-ui-fg-subtle">{formatCpf(fiscalDigits)}</strong>{" "}
          (documento do faturamento)
        </p>
        <ErrorMessage error={error} />
        <Button onClick={gerarPix} isLoading={loading} className="mt-1 w-fit">
          Gerar PIX
        </Button>
      </div>
    )
  }

  // Fallback: documento de faturamento ausente → pede aqui.
  return (
    <div className="flex flex-col gap-3 py-2 max-w-md">
      <p className="text-sm text-ui-fg-subtle">
        Pagamento via <strong>PIX</strong> — aprovação na hora. Informe seu CPF ou CNPJ pra gerar o código.
      </p>
      <label className="text-sm font-medium text-ui-fg-base">CPF ou CNPJ do pagador</label>
      <input
        inputMode="numeric"
        value={cpf}
        onChange={(e) => setCpf(formatCpf(e.target.value))}
        placeholder="CPF ou CNPJ"
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
