import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Token do link "retomar carrinho" (/[cc]/carrinho/retomar/[token]) — e-mail
 * de carrinho abandonado.
 *
 * ⚠️ CONTRATO COMPARTILHADO com o script Python do servidor (carrinho
 * abandonado) — NUNCA mudar a fórmula de um lado só. A fórmula, EXPLÍCITA:
 *
 *   assinatura = hex( hmac_sha256( key=CARRINHO_SECRET, msg=cart_id ) )
 *   token da URL = `${cart_id}.${assinatura}`
 *   link         = https://copamarfraldas.com.br/br/carrinho/retomar/{token}
 *
 * onde:
 *   - cart_id         = id do carrinho no Medusa, EXATO como na tabela cart
 *                       (ex.: "cart_01JXXXXXXXXXXXXXXXXXXXXXXX")
 *   - CARRINHO_SECRET = segredo compartilhado (env do storefront + env do
 *                       script). Env SEPARADA da RECOMPRA_SECRET de propósito
 *                       (fluxos desacoplados; rotacionar um não quebra o outro).
 *
 * Em Python:
 *   sig = hmac.new(CARRINHO_SECRET.encode(), cart_id.encode(),
 *                  hashlib.sha256).hexdigest()
 *   token = f"{cart_id}.{sig}"
 *
 * O cart_id vai em claro no token (precisa: é como a rota sabe qual carrinho
 * retomar); o HMAC impede forjar link pra carrinho alheio chutando ids.
 */

const SECRET = process.env.CARRINHO_SECRET || ""

/** assinatura hex de 64 chars — hex(hmac_sha256(CARRINHO_SECRET, cart_id)) */
export function assinaturaCarrinho(cartId: string): string {
  if (!SECRET) {
    throw new Error("CARRINHO_SECRET não configurada no env do storefront")
  }
  return createHmac("sha256", SECRET).update(String(cartId)).digest("hex")
}

/** token completo pra URL: `${cartId}.${assinatura}` */
export function gerarTokenCarrinho(cartId: string): string {
  return `${cartId}.${assinaturaCarrinho(cartId)}`
}

/** confere a assinatura recebida na URL contra a recomputada (timing-safe) */
export function verificaAssinaturaCarrinho(
  cartId: string,
  assinatura: string
): boolean {
  try {
    // Uint8Array explícito: o timingSafeEqual dos @types/node daqui não aceita
    // Buffer direto (choque ArrayBufferLike/SharedArrayBuffer no tsc)
    const esperada = new Uint8Array(
      Buffer.from(assinaturaCarrinho(cartId), "hex")
    )
    const recebida = new Uint8Array(Buffer.from(String(assinatura || ""), "hex"))
    return (
      esperada.length === 32 &&
      recebida.length === esperada.length &&
      timingSafeEqual(esperada, recebida)
    )
  } catch {
    return false
  }
}
