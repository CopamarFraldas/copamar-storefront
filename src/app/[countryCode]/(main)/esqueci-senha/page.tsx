import type { Metadata } from "next"
import EsqueciSenhaForm from "@modules/account/components/esqueci-senha-form"

export const metadata: Metadata = {
  title: { absolute: "Esqueci minha senha | Copamar Fraldas" },
  robots: { index: false, follow: false },
}

export default function EsqueciSenhaPage() {
  return (
    <div className="content-container flex justify-center py-16">
      <EsqueciSenhaForm />
    </div>
  )
}
