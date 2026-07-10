import "server-only"
import { createHmac } from "node:crypto"

/**
 * Token do link mágico da ENTREGA PROGRAMADA (/[cc]/assinatura/[token]).
 *
 * ⚠️ CONTRATO COMPARTILHADO em TRÊS pontas — NUNCA mudar a fórmula de um lado
 * só:
 *   - o job do servidor /root/copamar/scripts/assinatura-ciclo.py GERA o token
 *     (lê ASSINATURA_SECRET deste .env, padrão RECOMPRA_SECRET);
 *   - o backend Medusa VERIFICA (src/lib/assinaturas.ts, rota
 *     GET /store/assinaturas/ciclo/:token — timing-safe);
 *   - esta rota do front /br/assinatura/[token] só valida o FORMATO e repassa.
 *
 * A fórmula, EXPLÍCITA (mesmo desenho do recompra-token.ts):
 *
 *   assinatura_hex = hex( hmac_sha256( key=ASSINATURA_SECRET,
 *                                      msg=`${assinatura_id}:${celular_digits}` ) )
 *   token da URL   = `${assinatura_id}.${assinatura_hex}`
 *   link           = https://www.copamarfraldas.com.br/br/assinatura/{token}
 *
 * onde:
 *   - assinatura_id  = id da linha na tabela `assinaturas` do POSTGRES DO
 *                      MEDUSA (formato `asn_` + 32 hex) — NÃO é Supabase e NÃO
 *                      é o display_id do pedido
 *   - celular_digits = SÓ os dígitos do celular COMO GRAVADO na linha
 *                      (.replace(/\D/g, ""); em Python: re.sub(r"\D", "", cel))
 *   - ASSINATURA_SECRET = segredo compartilhado (.env do storefront + .env do
 *                      backend). SEPARADA das outras secrets de propósito.
 *
 * Em Python (o job):
 *   hmac.new(secret.encode(), f"{assinatura_id}:{celular_digits}".encode(),
 *            hashlib.sha256).hexdigest()
 *
 * A verificação NÃO acontece no front: o celular mora na tabela do backend,
 * então quem recomputa o HMAC é a rota /store/assinaturas/ciclo/:token.
 *
 * A HMAC da ADESÃO pós-compra (server action → POST /store/assinaturas/aderir)
 * também vive aqui, com a MESMA secret e msg própria:
 *   adesao_hex = hex( hmac_sha256( ASSINATURA_SECRET,
 *                                  `adesao:${order_id}:${frequencia_dias}` ) )
 * O client NUNCA vê a secret — a server action assina e o backend recomputa.
 */

const SECRET = process.env.ASSINATURA_SECRET || ""

/** token bem-formado: `asn_` + 32 hex, PONTO, 64 hex (assinatura HMAC) */
export const ASSINATURA_TOKEN_RE = /^(asn_[0-9a-f]{32})\.([0-9a-f]{64})$/i

/** HMAC da adesão — header x-assinatura-adesao do POST /store/assinaturas/aderir */
export function adesaoHmacHex(orderId: string, frequenciaDias: number): string {
  if (!SECRET) {
    throw new Error("ASSINATURA_SECRET não configurada no env do storefront")
  }
  return createHmac("sha256", SECRET)
    .update(`adesao:${orderId}:${frequenciaDias}`)
    .digest("hex")
}
