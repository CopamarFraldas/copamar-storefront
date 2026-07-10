import {
  login,
  solicitarCodigoLogin,
  entrarComCodigo,
} from "@lib/data/customer"
import { LOGIN_MIGRADO } from "@lib/util/migracao-constants"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState, useState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [modo, setModo] = useState<"senha" | "codigo">("senha")
  const [ident, setIdent] = useState("")
  const [msgSenha, actionSenha] = useActionState(login, null)
  const [stSolicita, actionSolicita] = useActionState(solicitarCodigoLogin, null)
  const [stValida, actionValida] = useActionState(entrarComCodigo, null)
  const codigoEnviado = !!stSolicita?.enviado

  const campoIdentificador = (
    <Input
      label="CPF, telefone ou e-mail"
      name="identifier"
      type="text"
      autoComplete="username"
      required
      value={ident}
      onChange={(e) => setIdent(e.target.value)}
      data-testid="email-input"
    />
  )

  const aba = (alvo: "senha" | "codigo", texto: string) => (
    <button
      type="button"
      onClick={() => setModo(alvo)}
      className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
        modo === alvo
          ? "bg-white shadow-sm text-copamar-primary"
          : "text-ui-fg-subtle"
      }`}
    >
      {texto}
    </button>
  )

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Bem-vindo de volta</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-6">
        Entre para uma experiência de compra completa.
      </p>

      <div className="flex w-full rounded-full bg-ui-bg-subtle p-1 mb-6">
        {aba("senha", "Com senha")}
        {aba("codigo", "Código por e-mail")}
      </div>

      {modo === "senha" ? (
        <form className="w-full" action={actionSenha}>
          <div className="flex flex-col w-full gap-y-2">
            {campoIdentificador}
            <Input
              label="Senha"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              data-testid="password-input"
            />
          </div>
          {msgSenha === LOGIN_MIGRADO ? (
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
                Confira sua caixa de entrada (e o spam). Ou entre agora pelo
                <strong> código por e-mail</strong> aqui em cima. 💙
              </p>
            </div>
          ) : (
            <ErrorMessage error={msgSenha} data-testid="login-error-message" />
          )}
          <SubmitButton data-testid="sign-in-button" className="w-full mt-6">
            Entrar
          </SubmitButton>
          <LocalizedClientLink
            href="/esqueci-senha"
            className="mt-4 block text-center text-small-regular text-ui-fg-subtle underline"
            data-testid="esqueci-senha-link"
          >
            Esqueci minha senha
          </LocalizedClientLink>
        </form>
      ) : !codigoEnviado ? (
        <form className="w-full" action={actionSolicita}>
          <div className="flex flex-col w-full gap-y-2">{campoIdentificador}</div>
          <p className="mt-2 text-xs text-ui-fg-subtle">
            Enviaremos um código de 6 dígitos para o e-mail cadastrado — sem
            precisar da senha.
          </p>
          <ErrorMessage error={stSolicita?.erro} />
          <SubmitButton className="w-full mt-6">
            Enviar código por e-mail
          </SubmitButton>
        </form>
      ) : (
        <form className="w-full" action={actionValida}>
          <div className="mb-4 rounded-large border border-copamar-primary/25 bg-copamar-primary/5 p-4 text-left text-sm text-ui-fg-base">
            📧 Se houver uma conta, enviamos um código de 6 dígitos para o e-mail
            cadastrado. Confira sua caixa de entrada (e o spam) e digite abaixo.
          </div>
          <input type="hidden" name="identifier" value={ident} />
          <Input
            label="Código de 6 dígitos"
            name="codigo"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            data-testid="codigo-input"
          />
          <ErrorMessage error={stValida?.erro} data-testid="codigo-error-message" />
          <SubmitButton data-testid="entrar-codigo-button" className="w-full mt-6">
            Entrar
          </SubmitButton>
          <button
            type="submit"
            formAction={actionSolicita}
            formNoValidate
            className="mt-3 block w-full text-center text-small-regular text-ui-fg-subtle underline"
          >
            Reenviar código
          </button>
        </form>
      )}

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
