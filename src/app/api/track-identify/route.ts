import { NextRequest, NextResponse } from "next/server"
import { getAuthHeaders } from "@lib/data/cookies"
import { sdk } from "@lib/config"

/**
 * Ponte de identidade (#47) — server-side. O componente client envia o
 * uuid_anonimo (localStorage do tracking); aqui lemos o JWT do cliente (cookie
 * httpOnly, só acessível no servidor) e repassamos pro backend Medusa
 * (/store/track/identify), que liga uuid↔cliente. Sem cliente logado = no-op.
 * NÃO toca n8n.
 */
export async function POST(req: NextRequest) {
  try {
    const { uuid_anonimo } = (await req.json().catch(() => ({}))) as {
      uuid_anonimo?: string
    }
    const auth = await getAuthHeaders()
    if (!uuid_anonimo || !("authorization" in auth)) {
      return NextResponse.json({ ok: false })
    }
    const r = await sdk.client
      .fetch("/store/track/identify", {
        method: "POST",
        body: { uuid_anonimo },
        headers: auth as Record<string, string>,
      })
      .catch(() => ({ ok: false }))
    return NextResponse.json(r)
  } catch {
    return NextResponse.json({ ok: false })
  }
}
