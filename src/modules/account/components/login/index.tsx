import { login } from "@lib/data/customer"
import { LOGIN_MIGRADO } from "@lib/util/migracao-constants"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Bem-vindo de volta</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Entre para uma experiência de compra completa.
      </p>
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="E-mail"
            name="email"
            type="email"
            title="Digite um e-mail válido."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Senha"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        {message === LOGIN_MIGRADO ? (
          /* conta migrada do site antigo: tom de boas-vindas, não de erro */
          <div
            className="mt-4 rounded-large border border-copamar-primary/25 bg-copamar-primary/5 p-4 text-left"
            data-testid="login-migrado-message"
          >
            <p className="text-sm font-semibold text-copamar-primary">
              🎉 Estamos de site novo!
            </p>
            <p className="mt-1 text-sm text-ui-fg-base">
              Trocamos de site para te atender melhor — e a sua conta já está
              aqui, com seus dados preservados. Acabamos de enviar um e-mail
              para você <strong>definir sua nova senha</strong>.
            </p>
            <p className="mt-2 text-xs text-ui-fg-subtle">
              Confira sua caixa de entrada (e o spam). Depois é só voltar e
              entrar normalmente. 💙
            </p>
          </div>
        ) : (
          <ErrorMessage error={message} data-testid="login-error-message" />
        )}
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6">
          Entrar
        </SubmitButton>
      </form>
      <LocalizedClientLink
        href="/esqueci-senha"
        className="mt-4 text-small-regular text-ui-fg-subtle underline"
        data-testid="esqueci-senha-link"
      >
        Esqueci minha senha
      </LocalizedClientLink>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Ainda não tem cadastro?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="underline"
          data-testid="register-button"
        >
          Cadastre-se
        </button>
        .
      </span>
    </div>
  )
}

export default Login
