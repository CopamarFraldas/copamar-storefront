"use client"

import { useActionState, useState } from "react"
import Input from "@modules/common/components/input"
import { maskCpfCnpj, isValidCpfOrCnpj } from "@lib/util/cpf"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"
import { CPF_JA_CADASTRADO, EMAIL_JA_CADASTRADO } from "@lib/util/migracao-constants"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signup, null)
  const [cpf, setCpf] = useState("")
  const cpfDigits = cpf.replace(/\D/g, "")
  // só acusa quando já tem o tamanho de CPF (11) ou CNPJ (14) — não durante a digitação
  const cpfInvalido =
    (cpfDigits.length === 11 || cpfDigits.length === 14) &&
    !isValidCpfOrCnpj(cpfDigits)

  return (
    <div
      className="max-w-sm flex flex-col items-center"
      data-testid="register-page"
    >
      <h1 className="text-large-semi uppercase mb-6">
        Crie sua conta na Copamar Fraldas
      </h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-4">
        Crie sua conta e tenha acesso a uma experiência de compra completa.
      </p>
      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Nome"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label="Sobrenome"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          <Input
            label="E-mail"
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <div>
            <Input
              label="CPF ou CNPJ"
              name="cpf"
              required
              inputMode="numeric"
              autoComplete="off"
              value={cpf}
              onChange={(e) => setCpf(maskCpfCnpj(e.target.value))}
              data-testid="cpf-input"
            />
            {cpfInvalido && (
              <p className="text-xs text-rose-500 mt-1" data-testid="cpf-error">
                CPF/CNPJ inválido — confira os números.
              </p>
            )}
          </div>
          <Input
            label="Telefone"
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label="Senha"
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>
        {message === CPF_JA_CADASTRADO ? (
          /* CPF já tem cadastro (importado do site antigo): tom acolhedor +
             caminho claro pra login, sem cara de erro. */
          <div
            className="mt-4 rounded-large border border-copamar-primary/25 bg-copamar-primary/5 p-4 text-left"
            data-testid="register-cpf-existe-message"
          >
            <p className="text-sm font-semibold text-copamar-primary">
              Esse CPF já tem cadastro na Copamar 💙
            </p>
            <p className="mt-1 text-sm text-ui-fg-base">
              Você já tem conta com a gente (importada do nosso site anterior).
              Não precisa criar outra — é só{" "}
              <button
                type="button"
                onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
                className="underline font-medium text-copamar-primary"
              >
                fazer login
              </button>{" "}
              com o seu e-mail. Você vai cair direto na etapa de receber um
              e-mail para criar a sua nova senha.
            </p>
            <p className="mt-2 text-xs text-ui-fg-subtle">
              Não consegue entrar? Fale com a gente no WhatsApp{" "}
              <strong>(11) 95205-0000</strong>.
            </p>
          </div>
        ) : message === EMAIL_JA_CADASTRADO ? (
          /* E-mail já tem conta: orienta a logar, sem cara de erro técnico. */
          <div
            className="mt-4 rounded-large border border-copamar-primary/25 bg-copamar-primary/5 p-4 text-left"
            data-testid="register-email-existe-message"
          >
            <p className="text-sm font-semibold text-copamar-primary">
              Esse e-mail já tem conta na Copamar 💙
            </p>
            <p className="mt-1 text-sm text-ui-fg-base">
              Você já tem uma conta com esse e-mail. Não precisa criar outra — é
              só{" "}
              <button
                type="button"
                onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
                className="underline font-medium text-copamar-primary"
              >
                fazer login
              </button>
              . Se não lembrar a senha, use o “Esqueci minha senha” na tela de
              login.
            </p>
            <p className="mt-2 text-xs text-ui-fg-subtle">
              Não consegue entrar? Fale com a gente no WhatsApp{" "}
              <strong>(11) 95205-0000</strong>.
            </p>
          </div>
        ) : (
          <ErrorMessage error={message} data-testid="register-error" />
        )}
        <span className="text-center text-ui-fg-base text-small-regular mt-6">
          Ao criar uma conta, você concorda com os{" "}
          <LocalizedClientLink
            href="/content/privacy-policy"
            className="underline"
          >
            Política de Privacidade
          </LocalizedClientLink>{" "}
          e os{" "}
          <LocalizedClientLink
            href="/content/terms-of-use"
            className="underline"
          >
            Termos de Uso
          </LocalizedClientLink>
          .
        </span>
        <SubmitButton className="w-full mt-6" data-testid="register-button">
          Cadastrar
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Já tem cadastro?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline"
        >
          Entrar
        </button>
        .
      </span>
    </div>
  )
}

export default Register
