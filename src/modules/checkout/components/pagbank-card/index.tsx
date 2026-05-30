"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@medusajs/ui"
import { createPagbankCard, checkPagbankStatus } from "@lib/data/pagbank"
import { placeOrder } from "@lib/data/cart"
import { isValidCpfOrCnpj, maskCpfCnpj } from "@lib/util/cpf"
import ErrorMessage from "../error-message"

type Stage = "form" | "processing" | "pending" | "paid"

// Só o caminho 'rc' é servido pelo PagBank (estável/latest dão 403). Fixamos o
// conteúdo via SRI (integrity). ⚠️ MANUTENÇÃO: se o PagBank atualizar o SDK, este
// hash precisa ser recomputado (senão o browser bloqueia o script).
const SDK_SRC =
  "https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js"
const SDK_SRI =
  "sha384-3pipk0SHgQsazqN+7OIBR5kOWArs1+A9Bd5sdPtQYcMaOHuMisO154O1kdzMlqua"

const MAX_PARCELAS = 3

const onlyDigits = (v: string) => v.replace(/\D/g, "")

const formatCpf = maskCpfCnpj // CPF (11) ou CNPJ (14) — máscara dinâmica

const formatCard = (v: string) =>
  onlyDigits(v)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim()

const formatExpiry = (v: string) =>
  onlyDigits(v)
    .slice(0, 4)
    .replace(/(\d{2})(\d)/, "$1/$2")

/** Detecção simples da bandeira só pra UX (não decide nada no pagamento). */
const brandOf = (num: string) => {
  const n = onlyDigits(num)
  if (/^4/.test(n)) return "Visa"
  if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard"
  if (/^3[47]/.test(n)) return "Amex"
  if (/^(606282|3841|636)/.test(n)) return "Elo"
  return ""
}

/** Validade no formato MM/AA não está vencida nem é inválida. */
const expiryOk = (mm: string, yy: string) => {
  const m = parseInt(mm)
  const y = 2000 + parseInt(yy)
  if (!m || m < 1 || m > 12 || !yy || yy.length !== 2) return false
  const now = new Date()
  const last = new Date(y, m, 0, 23, 59, 59) // último dia do mês de validade
  return last >= new Date(now.getFullYear(), now.getMonth(), 1)
}

/**
 * Checkout CARTÃO de crédito PagBank — UX moderna alinhada ao PIX.
 * O número do cartão é criptografado NO NAVEGADOR (SDK PagBank / encryptCard):
 * só o token cifrado vai pro servidor (PCI — o número nunca trafega pra gente).
 * Parcelamento até 3x. Cobrança síncrona → confirma e finaliza o pedido.
 */
const PagBankCard = ({ cartId }: { cartId: string }) => {
  const [stage, setStage] = useState<Stage>("form")
  const [number, setNumber] = useState("")
  const [holder, setHolder] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [cpf, setCpf] = useState("")
  const [parcelas, setParcelas] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const sdkRef = useRef(false)

  const brand = brandOf(number)

  // carrega o SDK do PagBank uma única vez (com SRI)
  useEffect(() => {
    if (sdkRef.current) return
    sdkRef.current = true
    if (typeof window !== "undefined" && (window as any).PagSeguro) {
      setSdkReady(true)
      return
    }
    const s = document.createElement("script")
    s.src = SDK_SRC
    s.integrity = SDK_SRI
    s.crossOrigin = "anonymous"
    s.async = true
    s.onload = () => setSdkReady(true)
    s.onerror = () =>
      setError("Não foi possível carregar o módulo de pagamento. Recarregue a página.")
    document.body.appendChild(s)
  }, [])

  function finalizar() {
    setStage("paid")
    setTimeout(() => placeOrder().catch((e) => setError(e?.message)), 1200)
  }

  // cartão em processamento (status não-síncrono): confirma via polling
  async function aguardarConfirmacao() {
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 3000))
      try {
        const { paid } = await checkPagbankStatus(cartId)
        if (paid) return finalizar()
      } catch {
        /* tenta de novo */
      }
    }
    setStage("form")
    setError(
      "Seu pagamento está em análise pela operadora. Se for aprovado, o pedido é confirmado automaticamente."
    )
  }

  async function pagar() {
    if (stage === "processing" || stage === "pending") return // anti double-submit
    setError(null)
    const numDigits = onlyDigits(number)
    const [mm, yy] = expiry.split("/")

    if (numDigits.length < 13) return setError("Número do cartão inválido.")
    if (!holder.trim()) return setError("Informe o nome impresso no cartão.")
    if (!expiryOk(mm, yy)) return setError("Validade inválida ou vencida (use MM/AA).")
    if (onlyDigits(cvv).length < 3) return setError("CVV inválido.")
    if (!isValidCpfOrCnpj(cpf)) return setError("Informe um CPF ou CNPJ válido.")

    const PagSeguro = (window as any).PagSeguro
    if (!sdkReady || !PagSeguro?.encryptCard) {
      return setError("Módulo de pagamento ainda carregando. Tente novamente em instantes.")
    }

    setStage("processing")
    try {
      // ── tokenização NO CLIENTE (o número não sai daqui) ──
      const enc = PagSeguro.encryptCard({
        publicKey: process.env.NEXT_PUBLIC_PAGBANK_PUBLIC_KEY,
        holder: holder.trim(),
        number: numDigits,
        expMonth: mm,
        expYear: `20${yy}`,
        securityCode: onlyDigits(cvv),
      })

      if (enc.hasErrors || !enc.encryptedCard) {
        const msg = (enc.errors ?? []).map((e: any) => e.message || e.code).join(" · ")
        throw new Error(msg || "Não foi possível validar os dados do cartão.")
      }

      const { status } = await createPagbankCard(
        cartId,
        onlyDigits(cpf),
        enc.encryptedCard,
        holder.trim(),
        parcelas
      )

      if (status === "captured" || status === "authorized") {
        return finalizar()
      }
      if (status === "canceled" || status === "error") {
        setStage("form")
        return setError(
          "Pagamento não autorizado pela operadora. Confira os dados ou tente outro cartão."
        )
      }
      // status pendente/indefinido (WAITING) → estado próprio + confirma por polling
      setStage("pending")
      aguardarConfirmacao()
    } catch (e: any) {
      setStage("form")
      setError(e?.message || "Falha ao processar o cartão.")
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
        <p className="text-lg font-semibold text-ui-fg-base">Pagamento aprovado! 🎉</p>
        <p className="text-sm text-ui-fg-subtle">Finalizando seu pedido…</p>
      </div>
    )
  }

  // ── estágio: em análise (WAITING) ──
  if (stage === "pending") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1251b8] border-t-transparent" />
        <p className="text-base font-semibold text-ui-fg-base">Processando o pagamento…</p>
        <p className="text-sm text-ui-fg-subtle max-w-sm">
          A operadora está confirmando. Não feche a página — assim que aprovar, finalizamos seu pedido.
        </p>
      </div>
    )
  }

  const processing = stage === "processing"

  // ── estágio: formulário ──
  return (
    <div className="flex flex-col gap-3 py-2 max-w-md">
      <p className="text-sm text-ui-fg-subtle">
        Pagamento via <strong>cartão de crédito</strong> — aprovação na hora.
        Seus dados são criptografados no seu navegador.
      </p>

      <label className="text-sm font-medium text-ui-fg-base">Número do cartão</label>
      <div className="relative">
        <input
          inputMode="numeric"
          autoComplete="cc-number"
          value={number}
          onChange={(e) => setNumber(formatCard(e.target.value))}
          placeholder="0000 0000 0000 0000"
          disabled={processing}
          className="w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2 pr-20 text-ui-fg-base outline-none focus:border-[#1251b8] focus:ring-1 focus:ring-[#1251b8] disabled:opacity-60"
        />
        {brand && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ui-fg-muted">
            {brand}
          </span>
        )}
      </div>

      <label className="text-sm font-medium text-ui-fg-base">Nome impresso no cartão</label>
      <input
        autoComplete="cc-name"
        value={holder}
        onChange={(e) => setHolder(e.target.value.toUpperCase())}
        placeholder="COMO ESTÁ NO CARTÃO"
        disabled={processing}
        className="rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2 text-ui-fg-base outline-none focus:border-[#1251b8] focus:ring-1 focus:ring-[#1251b8] disabled:opacity-60"
      />

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm font-medium text-ui-fg-base">Validade</label>
          <input
            inputMode="numeric"
            autoComplete="cc-exp"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/AA"
            disabled={processing}
            className="rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2 text-ui-fg-base outline-none focus:border-[#1251b8] focus:ring-1 focus:ring-[#1251b8] disabled:opacity-60"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm font-medium text-ui-fg-base">CVV</label>
          <input
            inputMode="numeric"
            autoComplete="cc-csc"
            value={cvv}
            onChange={(e) => setCvv(onlyDigits(e.target.value).slice(0, 4))}
            placeholder="123"
            disabled={processing}
            className="rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2 text-ui-fg-base outline-none focus:border-[#1251b8] focus:ring-1 focus:ring-[#1251b8] disabled:opacity-60"
          />
        </div>
      </div>

      <label className="text-sm font-medium text-ui-fg-base">CPF ou CNPJ do titular</label>
      <input
        inputMode="numeric"
        value={cpf}
        onChange={(e) => setCpf(formatCpf(e.target.value))}
        placeholder="CPF ou CNPJ"
        disabled={processing}
        className="rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2 text-ui-fg-base outline-none focus:border-[#1251b8] focus:ring-1 focus:ring-[#1251b8] disabled:opacity-60"
      />

      <label className="text-sm font-medium text-ui-fg-base">Parcelamento</label>
      <select
        value={parcelas}
        onChange={(e) => setParcelas(Number(e.target.value))}
        disabled={processing}
        className="rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2 text-ui-fg-base outline-none focus:border-[#1251b8] focus:ring-1 focus:ring-[#1251b8] disabled:opacity-60"
      >
        {Array.from({ length: MAX_PARCELAS }, (_, i) => i + 1).map((p) => (
          <option key={p} value={p}>
            {p}x sem juros
          </option>
        ))}
      </select>

      <ErrorMessage error={error} />

      <Button onClick={pagar} isLoading={processing} disabled={!sdkReady} className="mt-1 w-fit">
        {sdkReady ? "Pagar com cartão" : "Carregando…"}
      </Button>
    </div>
  )
}

export default PagBankCard
