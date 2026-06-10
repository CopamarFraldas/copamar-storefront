import type { Metadata } from "next"
import RedefinirSenhaForm from "@modules/account/components/redefinir-senha-form"

// Página que consome o link do e-mail de redefinição (migração/esqueci a
// senha). NOINDEX — é transacional.
export const metadata: Metadata = {
  title: { absolute: "Definir nova senha | Copamar Fraldas" },
  robots: { index: false, follow: false },
}

export default async function RedefinirSenhaPage(props: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const { token = "", email = "" } = await props.searchParams
  return (
    <div className="content-container flex justify-center py-16">
      <RedefinirSenhaForm token={token} email={email} />
    </div>
  )
}
