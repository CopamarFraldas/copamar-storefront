"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useActionState } from "react"
import { login } from "@lib/data/customer"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"

/**
 * Login INLINE no checkout (Marco 04/06): visitante via só "criar conta" — quem
 * já tem conta não tinha onde entrar. Aqui entra SEM sair do checkout: a server
 * action `login` seta o token + revalida + transfere o carrinho; o refresh
 * re-renderiza a página já logado (endereço salvo preenche, recompra disponível).
 * Fechado por padrão (uma linha discreta) pra não atrapalhar quem é novo.
 */
const CheckoutLogin = () => {
  const [aberto, setAberto] = useState(false)
  // estado inicial = null; sucesso = undefined (a action só retorna string no erro)
  const [message, formAction] = useActionState(login, null)
  const router = useRouter()

  useEffect(() => {
    // login OK (sem mensagem de erro após submit) → re-renderiza o checkout logado
    if (message === undefined) router.refresh()
  }, [message, router])

  return (
    <div
      className="rounded-lg border border-ui-border-base bg-ui-bg-subtle/60 px-4 py-3"
      data-testid="checkout-login"
    >
      {!aberto ? (
        <p className="text-sm text-ui-fg-subtle">
          Já tem conta?{" "}
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="font-semibold text-copamar-primary underline underline-offset-2"
            data-testid="checkout-login-open"
          >
            Entrar
          </button>{" "}
          — seu endereço preenche sozinho.
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-y-3">
          <p className="text-sm font-medium text-ui-fg-base">
            Entre na sua conta
          </p>
          <div className="grid grid-cols-1 gap-3 small:grid-cols-2">
            <Input
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              required
              data-testid="checkout-login-email"
            />
            <Input
              label="Senha"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              data-testid="checkout-login-password"
            />
          </div>
          <ErrorMessage error={message} data-testid="checkout-login-error" />
          <div className="flex items-center gap-x-3">
            <SubmitButton
              className="h-10 px-6"
              data-testid="checkout-login-submit"
            >
              Entrar
            </SubmitButton>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="text-sm text-ui-fg-subtle underline underline-offset-2"
            >
              Continuar sem conta
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default CheckoutLogin
