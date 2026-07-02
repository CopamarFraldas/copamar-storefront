"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createHmac } from "crypto"
import { motoristaPorPin, motoristaPorId, type Motorista } from "./motoristas"

const COOKIE = "entregas_sessao"

// Segredo pra ASSINAR a sessão (HMAC). Sem isto o cookie valia "ok" fixo e
// qualquer um setava `entregas_sessao=ok` e entrava sem PIN (auditoria 18/06).
const SECRET =
  process.env.ENTREGAS_COOKIE_SECRET || process.env.REVALIDATE_SECRET || "entregas-copamar"

function assinar(payload: string): string {
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex")
  return `${payload}.${sig}`
}

/** Valida o HMAC e devolve o payload ("entregas:{motoristaId}:{ts}") ou null. */
function payloadValido(token: string | undefined): string | null {
  if (!token) return null
  const i = token.lastIndexOf(".")
  if (i <= 0) return null
  const payload = token.slice(0, i)
  if (!payload.startsWith("entregas:")) return null
  // token forjado (sem o SECRET) não bate o HMAC.
  if (assinar(payload) !== token) return null
  return payload
}

/**
 * Login por PIN — AGORA multi-motorista (Marco 24/06): cada motorista tem seu
 * PIN; o cookie guarda QUAL motorista entrou, e a rota é filtrada por ele.
 * Cookie httpOnly + ASSINADO, 12h. Sessões antigas (formato sem motorista) caem
 * como inválidas → re-login (esperado).
 */
export async function entrar(_state: unknown, formData: FormData) {
  const informado = String(formData.get("pin") || "").trim()
  const m = await motoristaPorPin(informado)
  if (!m) return "PIN incorreto — tente de novo."
  const c = await cookies()
  c.set(COOKIE, assinar(`entregas:${m.id}:${Date.now()}`), {
    httpOnly: true,
    sameSite: "lax",
    // a área só roda atrás de HTTPS em produção; NODE_ENV=development no runtime
    // NÃO pode tirar o Secure (era o bug: secure ficava sempre false).
    secure: true,
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

/** Motorista logado (do cookie assinado) ou null. */
export async function motoristaAtual(): Promise<Motorista | null> {
  const c = await cookies()
  const payload = payloadValido(c.get(COOKIE)?.value)
  if (!payload) return null
  // payload = "entregas:{motoristaId}:{ts}"  (formato antigo "entregas:{ts}" → null)
  const partes = payload.split(":")
  if (partes.length < 3) return null
  return await motoristaPorId(partes[1])
}

export async function logado(): Promise<boolean> {
  return (await motoristaAtual()) !== null
}
