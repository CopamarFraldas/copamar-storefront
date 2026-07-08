import { NextRequest, NextResponse } from "next/server"
import { retrieveCustomer } from "@lib/data/customer"

/**
 * Proxy do chat da MAPA no site (guardrail do WhatsApp restrito).
 *
 * O browser só fala com esta rota; ela repassa pro cérebro do crew
 * (POST {MAPA_CHAT_URL}/site/chat, header X-Site-Key) — URL interna e chave
 * NUNCA chegam ao client.
 *
 * Identidade: logado/email/nome saem do retrieveCustomer() (JWT no cookie
 * httpOnly, mesmo padrão do nav) — o que o browser mandar nesses campos é
 * IGNORADO (senão qualquer um "vira" outro cliente e puxa dados do CRM).
 *
 * Timeout 60s (o LLM leva ~16-30s). Qualquer erro/timeout → resposta amigável
 * com status 200: o widget trata tudo como fala da MAPA, sem tela de erro.
 */

const FALLBACK =
  "A MAPA está com dificuldade agora 🙈 tenta de novo em instantes?"

const TIMEOUT_MS = 60_000
const MAX_MSG = 2_000
const MAX_HISTORICO = 20

type Turno = { papel: "cliente" | "mapa"; texto: string }

/** Valida/normaliza o histórico vindo do browser. null = payload inválido. */
const sanitizarHistorico = (raw: unknown): Turno[] | null => {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw) || raw.length > MAX_HISTORICO) return null
  const out: Turno[] = []
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null
    const { papel, texto } = item as { papel?: unknown; texto?: unknown }
    if (papel !== "cliente" && papel !== "mapa") return null
    if (typeof texto !== "string") return null
    out.push({ papel, texto: texto.slice(0, MAX_MSG) })
  }
  return out
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    uuid?: unknown
    msg?: unknown
    historico?: unknown
  } | null

  // uuid do visitante: uuid v4 do tracking ou similar (8-64 chars seguros)
  const uuid = typeof body?.uuid === "string" ? body.uuid : ""
  const msg = typeof body?.msg === "string" ? body.msg : ""
  const historico = sanitizarHistorico(body?.historico)

  if (
    !/^[a-zA-Z0-9-]{8,64}$/.test(uuid) ||
    msg.trim().length < 1 ||
    msg.length > MAX_MSG ||
    historico === null
  ) {
    return NextResponse.json({ error: "payload inválido" }, { status: 400 })
  }

  // Identidade REAL, server-side (nunca confiar no browser)
  const customer = await retrieveCustomer().catch(() => null)
  const logado = Boolean(customer)
  const email = customer?.email ?? null
  const nome = customer
    ? [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || null
    : null

  const base = process.env.MAPA_CHAT_URL
  const key = process.env.SITE_CHAT_KEY
  if (!base || !key) {
    // env faltando ≠ erro do cliente: responde amigável e loga pro operador
    console.error("[mapa-chat] MAPA_CHAT_URL/SITE_CHAT_KEY ausentes no env")
    return NextResponse.json({ resposta: FALLBACK })
  }

  try {
    const r = await fetch(`${base}/site/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Site-Key": key,
      },
      body: JSON.stringify({
        uuid,
        msg: msg.trim(),
        historico,
        logado,
        email,
        nome,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    })
    if (!r.ok) {
      return NextResponse.json({ resposta: FALLBACK })
    }
    const j = (await r.json().catch(() => null)) as {
      resposta?: unknown
    } | null
    const resposta =
      typeof j?.resposta === "string" && j.resposta.trim().length > 0
        ? j.resposta
        : FALLBACK
    return NextResponse.json({ resposta })
  } catch {
    // timeout (60s) ou crew fora do ar
    return NextResponse.json({ resposta: FALLBACK })
  }
}
