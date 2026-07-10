import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Token do link mágico de recompra (/[cc]/recompra/[token]).
 *
 * ⚠️ CONTRATO COMPARTILHADO com o script do servidor (lembrete-recompra.py) —
 * NUNCA mudar a fórmula de um lado só. A fórmula, EXPLÍCITA:
 *
 *   assinatura = hex( hmac_sha256( key=RECOMPRA_SECRET,
 *                                  msg=`${order_display_id}:${celular_digits}` ) )
 *   token da URL = `${order_display_id}.${assinatura}`
 *   link         = https://copamarfraldas.com.br/br/recompra/{token}
 *
 * onde:
 *   - order_display_id = número do pedido (o "nº 1234" que o cliente vê), em decimal
 *   - celular_digits   = SÓ os dígitos do celular COMO GRAVADO na linha de
 *                        lembretes_recompra (aqui: .replace(/\D/g, "");
 *                        em Python: re.sub(r"\D", "", celular))
 *   - RECOMPRA_SECRET  = segredo compartilhado (env do storefront + env do script)
 *
 * Em Python:
 *   hmac.new(secret.encode(), f"{display_id}:{celular_digits}".encode(),
 *            hashlib.sha256).hexdigest()
 *
 * A verificação NÃO é reversível: a rota extrai o display_id do token, busca o
 * celular na linha de lembretes_recompra e recomputa a assinatura (timing-safe).
 */

const SECRET = process.env.RECOMPRA_SECRET || ""

/** só os dígitos do celular — MESMA normalização do Python (re.sub(r"\D","")) */
export function celularDigits(celular: string): string {
  return String(celular || "").replace(/\D/g, "")
}

/** assinatura hex de 64 chars — hex(hmac_sha256(secret, `${displayId}:${celularDigits}`)) */
export function assinaturaRecompra(
  displayId: string | number,
  celular: string
): string {
  if (!SECRET) {
    throw new Error("RECOMPRA_SECRET não configurada no env do storefront")
  }
  return createHmac("sha256", SECRET)
    .update(`${displayId}:${celularDigits(celular)}`)
    .digest("hex")
}

/** token completo pra URL: `${displayId}.${assinatura}` */
export function gerarTokenRecompra(
  displayId: string | number,
  celular: string
): string {
  return `${displayId}.${assinaturaRecompra(displayId, celular)}`
}

/** confere a assinatura recebida na URL contra a recomputada (timing-safe) */
export function verificaAssinaturaRecompra(
  displayId: string | number,
  celular: string,
  assinatura: string
): boolean {
  try {
    // Uint8Array explícito: o timingSafeEqual dos @types/node daqui não aceita
    // Buffer direto (choque ArrayBufferLike/SharedArrayBuffer no tsc)
    const esperada = new Uint8Array(
      Buffer.from(assinaturaRecompra(displayId, celular), "hex")
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
