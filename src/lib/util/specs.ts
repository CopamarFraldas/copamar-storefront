import { HttpTypes } from "@medusajs/types"

/**
 * Especificações FACTUAIS do produto (GEO/AEO #54): derivadas só do que existe
 * no catálogo — metadata.tamanho (normalização), quantidade extraída do título,
 * peso real da variant (frete), GTIN. NADA fabricado: campo sem fonte = omitido.
 * Usadas na tabela "Especificações" da PDP e no additionalProperty do Product
 * JSON-LD (IAs citam specs estruturadas com muito mais precisão que prosa).
 */
export function extrairSpecs(
  product: HttpTypes.StoreProduct
): { name: string; value: string }[] {
  const specs: { name: string; value: string }[] = []
  const meta = (product.metadata || {}) as Record<string, any>
  const v0: any = product.variants?.[0]

  if (meta.tamanho) {
    specs.push({ name: "Tamanho", value: String(meta.tamanho) })
  }

  // quantidade por pacote — extraída do TÍTULO real ("c/ 50 un", "com 5", "c/46")
  const qtd =
    product.title?.match(/c\/?\s*(\d{1,4})(\s*un)?/i) ||
    product.title?.match(/com\s+(\d{1,4})\b/i)
  if (qtd) {
    specs.push({ name: "Quantidade por pacote", value: `${qtd[1]} unidades` })
  }

  if (product.collection?.title) {
    specs.push({ name: "Marca", value: product.collection.title })
  }

  // peso real cadastrado pro frete (em gramas) — fica no PRODUTO no catálogo
  // migrado (S1); fallback pra variant
  const peso = Number((product as any).weight ?? v0?.weight ?? 0)
  if (peso > 0) {
    specs.push({
      name: "Peso do pacote",
      value:
        peso >= 1000
          ? `${(peso / 1000).toFixed(peso % 1000 === 0 ? 0 : 1)} kg`
          : `${peso} g`,
    })
  }

  // GTIN real: barcode quando existe; o catálogo migrado guarda o EAN no sku
  const ean = [v0?.barcode, v0?.sku].find((x) => x && /^\d{13}$/.test(String(x)))
  if (ean) {
    specs.push({ name: "Código de barras (EAN)", value: String(ean) })
  }

  return specs
}
