import { Metadata } from "next"

import InteractiveLink from "@modules/common/components/interactive-link"

export const metadata: Metadata = {
  // absolute: o template do layout anexaria "| Copamar" de novo.
  title: { absolute: "Página não encontrada | Copamar Fraldas" },
  description:
    "A página que você procura não existe ou foi movida. Volte para a página inicial ou veja todos os produtos da Copamar Fraldas.",
}

export default function NotFound() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">Página não encontrada</h1>
      <p className="text-small-regular text-ui-fg-base">
        A página que você tentou acessar não existe.
      </p>
      <InteractiveLink href="/">Ir para a página inicial</InteractiveLink>
      <InteractiveLink href="/store">Ver todos os produtos</InteractiveLink>
    </div>
  )
}
