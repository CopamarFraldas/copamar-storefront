"use client"

import { redefinirSenha } from "@lib/data/customer"
import { SENHA_REDEFINIDA } from "@lib/util/migracao-constants"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState } from "react"

/**
 * Form de nova senha (consome o token do e-mail). Sucesso → convite pra
 * entrar; o login marca a conta migrada como reivindicada.
 */
export default function RedefinirSenhaForm({
  token,
  email,
}: {
  token: string
  email: string
}) {
  const [message, formAction] = useActionState(redefinirSenha, null)

  if (message === SENHA_REDEFINIDA) {
    return (
      <div className="w-full max-w-sm text-center" data-testid="senha-ok">
        <h1 className="text-2xl font-bold text-copamar-primary">Senha definida! ✅</h1>
        <p className="mt-3 text-ui-fg-base">
          Tudo certo — agora é só entrar com seu e-mail e a senha nova.
        </p>
        <LocalizedClientLink
          href="/account"
          className="mt-6 inline-block rounded-large bg-copamar-cta px-6 py-3 font-semibold text-white transition-colors hover:bg-copamar-cta-dark"
        >
          Entrar na minha conta
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm" data-testid="redefinir-senha-page">
      <h1 className="text-2xl font-bold text-copamar-primary text-center">
        Definir nova senha
      </h1>
      <p className="mt-2 mb-6 text-center text-sm text-ui-fg-subtle">
        {email ? (
          <>
            Para a conta <strong>{email}</strong>.
          </>
        ) : (
          "Escolha sua nova senha."
        )}
      </p>
      <form action={formAction} className="flex w-full flex-col gap-y-3">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="email" value={email} />
        <Input
          label="Nova senha (mín. 8 caracteres)"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          data-testid="nova-senha-input"
        />
        <Input
          label="Confirmar a nova senha"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          required
          data-testid="confirma-senha-input"
        />
        {message && (
          <p className="text-small-regular text-rose-500" data-testid="redefinir-erro">
            {message}
          </p>
        )}
        <SubmitButton className="mt-3 w-full" data-testid="salvar-senha-button">
          Salvar nova senha
        </SubmitButton>
      </form>
    </div>
  )
}
