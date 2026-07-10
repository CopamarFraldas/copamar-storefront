import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { sdk } from "@lib/config"
import { getRegion } from "@lib/data/regions"
import { getAuthHeaders, getCacheTag } from "@lib/data/cookies"
import { verificaAssinaturaRecompra } from "@lib/util/recompra-token"

/**
 * Link mágico da recompra — /br/recompra/{display_id}.{hmac} (vem no WhatsApp
 * do lembrete "Me lembre de repor").
 *
 * Fluxo: valida o token (HMAC-SHA256, ver @lib/util/recompra-token) contra a
 * linha de lembretes_recompra no Supabase → monta um carrinho NOVO no Medusa
 * com os MESMOS variants/quantidades do pedido (preço ATUAL; item esgotado/
 * descontinuado é pulado em silêncio) → grava o cookie do carrinho → manda
 * direto pro /checkout. O PIX5 NÃO é aplicado aqui: ele entra sozinho no passo
 * de pagamento pelas regras existentes (setDescontoPix).
 *
 * É um ROUTE HANDLER (não page/RSC) de propósito: o Next PROÍBE Set-Cookie
 * durante render de server component — e sem cookie não tem "carrinho do
 * cliente". Aqui a gente seta o cookie na própria resposta de redirect.
 *
 * Token inválido/expirado → home com aviso discreto (?recompra=invalido).
 * Todos os itens sumiram → /store (o cliente remonta o pedido na loja).
 */

const SUPA = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY

// display_id decimal + assinatura hex de 64 chars, separados por ponto
const TOKEN_RE = /^(\d{1,12})\.([0-9a-f]{64})$/i

// bots de preview (WhatsApp/Telegram/etc.) buscam o link pra montar o cartão —
// não podem criar carrinho fantasma nem "gastar" nada; ganham a home.
const PREVIEW_BOT_RE =
  /whatsapp|facebookexternalhit|telegrambot|twitterbot|slackbot|linkedinbot|discordbot/i

type LinhaLembrete = {
  celular: string | null
  email: string | null
  itens: { variant_id: string; quantity: number }[] | null
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ countryCode: string; token: string }> }
) {
  const { countryCode, token } = await props.params
  const cc = /^[a-z]{2}$/i.test(countryCode || "")
    ? countryCode.toLowerCase()
    : "br"
  const origin = req.nextUrl.origin
  const home = NextResponse.redirect(
    new URL(`/${cc}?recompra=invalido`, origin),
    307
  )

  const ua = req.headers.get("user-agent") || ""
  if (PREVIEW_BOT_RE.test(ua)) {
    return NextResponse.redirect(new URL(`/${cc}`, origin), 307)
  }

  const m = TOKEN_RE.exec(String(token || ""))
  if (!m || !SUPA || !KEY) return home
  const displayId = m[1]
  const assinatura = m[2].toLowerCase()

  // 1) a linha do lembrete no Supabase tem o celular (pra recomputar o HMAC)
  //    e o snapshot dos itens do pedido
  let linha: LinhaLembrete | null = null
  try {
    const r = await fetch(
      `${SUPA}/rest/v1/lembretes_recompra?order_display_id=eq.${displayId}` +
        `&select=celular,email,itens&limit=1`,
      {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      }
    )
    if (r.ok) linha = ((await r.json()) as LinhaLembrete[])[0] || null
  } catch {
    /* Supabase fora → trata como inválido (home discreta) */
  }
  if (!linha?.celular) return home

  // 2) verificação server-side do token (timing-safe)
  if (!verificaAssinaturaRecompra(displayId, linha.celular, assinatura)) {
    return home
  }

  const itens = Array.isArray(linha.itens) ? linha.itens.slice(0, 50) : []
  if (!itens.length) {
    return NextResponse.redirect(new URL(`/${cc}/store`, origin), 307)
  }

  // 3) carrinho NOVO com preço ATUAL (só variant+qty; o Medusa re-preça).
  //    E-mail do pedido já vai no carrinho (checkout abre preenchido).
  try {
    const region = await getRegion(cc)
    if (!region) return home

    // se o navegador ainda tiver sessão do cliente, o carrinho já nasce dele
    // (link do WhatsApp costuma chegar sem cookies — aí fica guest, tudo bem)
    const headers = { ...(await getAuthHeaders()) }

    const { cart } = await sdk.store.cart.create(
      { region_id: region.id, email: linha.email || undefined },
      {},
      headers
    )

    let adicionados = 0
    for (const it of itens) {
      const variantId = it?.variant_id
      const qty = Math.max(1, Number(it?.quantity ?? 1))
      if (!variantId) continue
      try {
        await sdk.store.cart.createLineItem(
          cart.id,
          { variant_id: variantId, quantity: qty },
          {},
          headers
        )
        adicionados++
      } catch {
        /* esgotado/descontinuado → pula em silêncio (spec) */
      }
    }

    // TODOS sumiram → loja (nada de checkout vazio)
    if (adicionados === 0) {
      return NextResponse.redirect(new URL(`/${cc}/store`, origin), 307)
    }

    // cache de carrinho por visitante (se já existir cookie de cache)
    try {
      const tag = await getCacheTag("carts")
      if (tag) revalidateTag(tag)
    } catch {}

    const res = NextResponse.redirect(
      new URL(`/${cc}/checkout?step=address`, origin),
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
  } catch {
    return home
  }
}
