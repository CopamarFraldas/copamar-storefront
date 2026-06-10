"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const COOKIE = "entregas_sessao"
const pin = () => process.env.ENTREGAS_PIN || "2580"

/** Login por PIN do motorista/escritório. Cookie httpOnly de 12h. */
export async function entrar(_state: unknown, formData: FormData) {
  const informado = String(formData.get("pin") || "").trim()
  if (informado !== pin()) return "PIN incorreto — tente de novo."
  const c = await cookies()
  c.set(COOKIE, "ok", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production", // http em dev/teste; https em prod
    maxAge: 60 * 60 * 12,
    path: "/",
  })
  redirect("/entregas/rota")
}

export async function sair() {
  const c = await cookies()
  c.delete(COOKIE)
  redirect("/entregas")
}

export async function logado(): Promise<boolean> {
  const c = await cookies()
  return c.get(COOKIE)?.value === "ok"
}
