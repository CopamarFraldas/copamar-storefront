"use client"

import { solicitarResetSenha } from "@lib/data/customer"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"

/** "Esqueci minha senha": pede o e-mail e dispara o link de redefinição. */
export default function EsqueciSenhaForm() {
  const [message, formAction] = useActionState(solicitarResetSenha, null)
  return (
    <div className="w-full max-w-sm" data-testid="esqueci-senha-page">
      <h1 className="text-2xl font-bold text-copamar-primary text-center">
        Esqueci minha senha
      </h1>
      <p className="mt-2 mb-6 text-center text-sm text-ui-fg-subtle">
        Digite seu e-mail e enviaremos o link para definir uma nova senha.
      </p>
      <form action={formAction} className="flex w-full flex-col gap-y-3">
        <Input
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          data-testid="esqueci-email-input"
        />
        {message && (
          <p className="text-small-regular text-ui-fg-base" data-testid="esqueci-msg">
            {message}
          </p>
        )}
        <SubmitButton className="mt-3 w-full" data-testid="esqueci-enviar-button">
          Enviar link
        </SubmitButton>
      </form>
    </div>
  )
}
