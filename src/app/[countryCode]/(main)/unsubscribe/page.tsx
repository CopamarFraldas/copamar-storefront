import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Descadastro de e-mail ONE-CLICK (#68 — reputação de e-mail no cutover).
 * O link assinado dos e-mails (?e=<b64url>&t=<hmac>) cai aqui; o próprio
 * carregamento processa o opt-out no backend (one-click de verdade — sem
 * formulário). Token inválido = nada é gravado.
 */
export const metadata: Metadata = {
  title: "Descadastro de e-mails",
  robots: { index: false, follow: false }, // página utilitária — fora do índice
}

async function processarOptOut(e: string, t: string): Promise<{ ok: boolean; email?: string }> {
  const backend = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  try {
    const r = await fetch(`${backend}/store/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": pk },
      body: JSON.stringify({ e, t }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    })
    const d = await r.json().catch(() => ({}))
    return { ok: r.ok && d.ok === true, email: d.email }
  } catch {
    return { ok: false }
  }
}

export default async function UnsubscribePage(props: {
  searchParams: Promise<{ e?: string; t?: string }>
}) {
  const { e, t } = await props.searchParams
  const resultado = e && t ? await processarOptOut(e, t) : { ok: false as const }

  return (
    <div className="content-container max-w-xl py-16 text-center">
      {resultado.ok ? (
        <>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl dark:bg-green-900/40">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-ui-fg-base mb-2">
            Descadastro confirmado
          </h1>
          <p className="text-ui-fg-subtle">
            {resultado.email ? (
              <>
                O e-mail <strong className="text-ui-fg-base">{resultado.email}</strong>{" "}
                não receberá mais nossas comunicações de marketing.
              </>
            ) : (
              "Você não receberá mais nossas comunicações de marketing."
            )}{" "}
            E-mails sobre pedidos em andamento (confirmação, pagamento, entrega)
            continuam chegando normalmente.
          </p>
          <p className="mt-2 text-sm text-ui-fg-subtle">
            Mudou de ideia? É só falar com a gente no WhatsApp.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-ui-fg-base mb-2">
            Link inválido ou expirado
          </h1>
          <p className="text-ui-fg-subtle">
            Não foi possível processar o descadastro por este link. Se quiser
            parar de receber nossos e-mails, escreva pra{" "}
            <a
              href="mailto:vendas@copamarfraldas.com.br?subject=Descadastrar%20e-mails"
              className="text-copamar-primary underline"
            >
              vendas@copamarfraldas.com.br
            </a>{" "}
            que resolvemos na hora.
          </p>
        </>
      )}
      <LocalizedClientLink
        href="/"
        className="mt-8 inline-block text-sm text-copamar-primary underline"
      >
        ← Voltar pra loja
      </LocalizedClientLink>
    </div>
  )
}
