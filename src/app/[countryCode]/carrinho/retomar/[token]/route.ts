import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "@lib/config"
import { getCacheTag } from "@lib/data/cookies"
import { getCheckoutStep } from "@lib/util/get-checkout-step"
import { verificaAssinaturaCarrinho } from "@lib/util/carrinho-token"

/**
 * Link "retomar carrinho" — /br/carrinho/retomar/{cart_id}.{hmac} (vem no
 * e-mail de carrinho abandonado).
 *
 * Fluxo: valida o token (HMAC-SHA256, fórmula explícita em
 * @lib/util/carrinho-token) → busca o carrinho DIRETO no Medusa (sem cache) →
 * se ainda existe, tem itens e NÃO foi completado, grava o cookie do carrinho
 * (mesmo cookie do setCartId em @lib/data/cookies) e manda pro /checkout no
 * passo certo (getCheckoutStep: sem endereço → ?step=address, o próprio
 * checkout cuida do resto do funil).
 *
 * É um ROUTE HANDLER (não page/RSC) de propósito: o Next PROÍBE Set-Cookie
 * durante render de server component — aqui o cookie vai na própria resposta
 * de redirect (mesma técnica da rota /recompra/[token]).
 *
 * Token inválido/forjado → home, sem pista do que falhou.
 * Cart completado/expirado/vazio → /cart?retomar=expirado (aviso discreto que
 * o template do carrinho pode ignorar por ora).
 */

// cart_id do Medusa (prefixo cart_ + ULID) + assinatura hex de 64 chars,
// separados por ponto
const TOKEN_RE = /^(cart_[0-9A-Za-z]{20,40})\.([0-9a-f]{64})$/

// bots de preview (Gmail proxy/WhatsApp/etc.) buscam o link pra montar o
// cartão — não podem "gastar" o link nem trocar o carrinho de ninguém.
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
  const origin = req.nextUrl.origin
  const home = NextResponse.redirect(new URL(`/${cc}`, origin), 307)
  const expirado = NextResponse.redirect(
    new URL(`/${cc}/cart?retomar=expirado`, origin),
    307
  )

  const ua = req.headers.get("user-agent") || ""
  if (PREVIEW_BOT_RE.test(ua)) {
    return home
  }

  // 1) formato + assinatura (timing-safe) — inválido é indistinguível de
  //    inexistente: sempre home
  const m = TOKEN_RE.exec(String(token || ""))
  if (!m) return home
  const cartId = m[1]
  const assinatura = m[2].toLowerCase()
  if (!verificaAssinaturaCarrinho(cartId, assinatura)) return home

  // 2) o carrinho ainda vale? Busca DIRETA no Medusa, sem cache e SEM auth
  //    header: o clique vem do e-mail, o navegador pode nem ter sessão — o
  //    token já é a prova de posse do carrinho.
  let cart: HttpTypes.StoreCart | null = null
  try {
    const resp = await sdk.client.fetch<HttpTypes.StoreCartResponse>(
      `/store/carts/${cartId}`,
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
    cart = null // 404/erro → trata como expirado (o link era legítimo)
  }

  if (!cart || cart.completed_at || !cart.items?.length) {
    return expirado
  }

  // 3) cache de carrinho por visitante (se já existir cookie de cache) —
  //    senão o header/drawer poderia mostrar o carrinho antigo
  try {
    const tag = await getCacheTag("carts")
    if (tag) revalidateTag(tag)
  } catch {}

  const res = NextResponse.redirect(
    new URL(`/${cc}/checkout?step=${getCheckoutStep(cart)}`, origin),
    307
  )
  // MESMO cookie das actions (setCartId em @lib/data/cookies), com UMA
  // diferença deliberada: sameSite "lax" em vez de "strict". O clique vem do
  // E-MAIL (navegação CROSS-SITE): cookie strict setado nesse hop NÃO é
  // enviado no redirect seguinte pro /checkout → o cliente cairia num
  // checkout VAZIO. Lax é enviado em navegação top-level GET, que é
  // exatamente este fluxo.
  res.cookies.set("_medusa_cart_id", cart.id, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
  return res
}
