import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "@lib/config"
import { getCacheTag } from "@lib/data/cookies"
import { getCheckoutStep } from "@lib/util/get-checkout-step"
import { ASSINATURA_TOKEN_RE } from "@lib/util/assinatura-token"

/**
 * Link mágico da ENTREGA PROGRAMADA — /br/assinatura/{asn_…}.{hmac} (vem no
 * WhatsApp caloroso a cada ciclo).
 *
 * Diferente do /recompra (que MONTA um carrinho na hora), aqui o carrinho do
 * ciclo JÁ EXISTE: o motor (assinatura-ciclo.py) montou (itens do snapshot a
 * preços atuais, esgotado pulado) e aplicou a promoção ASSINATURA5 (5%
 * order-wide). Esta rota valida só o FORMATO do token e delega a verificação
 * de verdade pro backend — GET /store/assinaturas/ciclo/:token recomputa o
 * HMAC (timing-safe) contra a linha da tabela `assinaturas` no Postgres do
 * Medusa (fórmula em @lib/util/assinatura-token) e devolve o cart do ciclo.
 *
 * É um ROUTE HANDLER (não page/RSC) de propósito: o Next PROÍBE Set-Cookie
 * durante render de server component — aqui o cookie vai na própria resposta
 * de redirect (mesma técnica das rotas /recompra e /carrinho/retomar).
 *
 * Token inválido/forjado → home com aviso discreto (?recompra=invalido — o
 * mesmo aviso genérico "link não vale mais" da home serve).
 * Token legítimo sem ciclo pagável (pausada/cancelada/já pago/motor ainda não
 * montou) → painel de assinaturas no /account (?ep=ciclo).
 * Bots de preview (WhatsApp/etc.) → home, sem tocar em nada.
 */

// bots de preview (WhatsApp/Telegram/etc.) buscam o link pra montar o cartão —
// não podem "gastar" o link nem trocar o carrinho de ninguém; ganham a home.
const PREVIEW_BOT_RE =
  /whatsapp|facebookexternalhit|telegrambot|twitterbot|slackbot|linkedinbot|discordbot|googleimageproxy/i

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ countryCode: string; token: string }> }
) {
  const { countryCode, token } = await props.params
  const cc = /^[a-z]{2}$/i.test(countryCode || "")
    ? countryCode.toLowerCase()
    : "br"
  // atrás do Caddy o nextUrl.origin vira localhost:8000 — Location quebrada
  // no navegador do cliente. Preferir o domínio público configurado.
  const origin = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin
  const home = NextResponse.redirect(
    new URL(`/${cc}?recompra=invalido`, origin),
    307
  )
  // ciclo já pago/inexistente ou assinatura pausada/cancelada → painel do
  // cliente (o card "Minhas entregas programadas" mora lá)
  const painel = NextResponse.redirect(
    new URL(`/${cc}/account?ep=ciclo`, origin),
    307
  )

  const ua = req.headers.get("user-agent") || ""
  if (PREVIEW_BOT_RE.test(ua)) {
    return NextResponse.redirect(new URL(`/${cc}`, origin), 307)
  }

  if (!ASSINATURA_TOKEN_RE.test(String(token || ""))) return home

  // 1) o BACKEND é quem valida o token (HMAC timing-safe contra a linha) e
  //    devolve o cart do ciclo em voo. Server-to-server via rede interna.
  let ciclo: { ok?: boolean; cart_id?: string; motivo?: string } | null = null
  try {
    const base = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
    const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    const r = await fetch(
      `${base}/store/assinaturas/ciclo/${encodeURIComponent(String(token))}`,
      {
        headers: { "x-publishable-api-key": pk },
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      }
    )
    if (r.ok) ciclo = await r.json()
  } catch {
    /* backend fora → trata como inválido (home discreta) */
  }
  if (!ciclo?.ok || !ciclo.cart_id) {
    // token legítimo mas sem ciclo pra pagar → painel; forjado/flag OFF → home
    return ciclo?.motivo === "sem_ciclo" ? painel : home
  }

  // 2) o cart do ciclo ainda vale? Busca DIRETA no Medusa, sem cache e SEM
  //    auth header: o clique vem do WhatsApp, o navegador pode nem ter sessão
  //    — o token já é a prova de posse.
  let cart: HttpTypes.StoreCart | null = null
  try {
    const resp = await sdk.client.fetch<HttpTypes.StoreCartResponse>(
      `/store/carts/${ciclo.cart_id}`,
      {
        method: "GET",
        query: {
          fields:
            "id,email,completed_at,*items,*shipping_address,*shipping_methods",
        },
        cache: "no-store",
      }
    )
    cart = resp.cart
  } catch {
    cart = null // 404/erro → ciclo indisponível (o link era legítimo)
  }
  if (!cart || cart.completed_at || !cart.items?.length) {
    return painel
  }

  // cache de carrinho por visitante (se já existir cookie de cache) — senão o
  // header/drawer poderia mostrar o carrinho antigo
  try {
    const tag = await getCacheTag("carts")
    if (tag) revalidateTag(tag)
  } catch {}

  const res = NextResponse.redirect(
    new URL(`/${cc}/checkout?step=${getCheckoutStep(cart)}`, origin),
    307
  )
  // MESMO cookie das actions (setCartId), com UMA diferença deliberada:
  // sameSite "lax" em vez de "strict". O clique vem do WhatsApp (navegação
  // CROSS-SITE): cookie strict setado nesse hop NÃO é enviado no redirect
  // seguinte pro /checkout → o cliente cairia num checkout VAZIO. Lax é
  // enviado em navegação top-level GET, que é exatamente este fluxo.
  res.cookies.set("_medusa_cart_id", cart.id, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
  return res
}
