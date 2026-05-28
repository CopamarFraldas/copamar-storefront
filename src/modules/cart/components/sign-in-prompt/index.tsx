import { Button, Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <div className="bg-ui-bg-base flex items-center justify-between">
      <div>
        <Heading level="h2" className="txt-xlarge">
          Já tem conta?
        </Heading>
        <Text className="txt-medium text-ui-fg-subtle mt-2">
          Entre para uma experiência de compra mais rápida.
        </Text>
      </div>
      <div>
        <LocalizedClientLink href="/account">
          <Button variant="secondary" className="h-10" data-testid="sign-in-button">
            Entrar
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
