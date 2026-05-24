"use client"

import { resetOnboardingState } from "@lib/data/onboarding"
import { Button, Container, Text } from "@medusajs/ui"

const OnboardingCta = ({ orderId }: { orderId: string }) => {
  return (
    <Container className="max-w-4xl h-full bg-ui-bg-subtle w-full">
      <div className="flex flex-col gap-y-4 center p-4 md:items-center">
        <Text className="text-ui-fg-base text-xl">
          Seu pedido de teste foi criado! 🎉
        </Text>
        <Text className="text-ui-fg-subtle text-small-regular">
          Agora você pode terminar a configuração da loja no admin.
        </Text>
        <Button
          className="w-fit"
          size="xlarge"
          onClick={() => resetOnboardingState(orderId)}
        >
          Concluir configuração no admin
        </Button>
      </div>
    </Container>
  )
}

export default OnboardingCta
