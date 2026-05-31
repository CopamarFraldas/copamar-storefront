"use client"

import { useState } from "react"
import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { useParams, useRouter } from "next/navigation"
import { addToCart } from "@lib/data/cart"

/**
 * Botão "Comprar/Adicionar" no card da vitrine (#48) — comprar sem entrar no
 * produto. 1 variante → adiciona direto; 1 dimensão de opção (ex.: Tamanho) →
 * quick-select inline no card; multi-dimensão/sem dados → vai pro produto.
 * preventDefault/stopPropagation pra não navegar pelo link que envolve o card.
 */

const inStock = (v?: HttpTypes.StoreProductVariant | any) =>
  !!v && (!v.manage_inventory || v.allow_backorder || (v.inventory_quantity ?? 0) > 0)

const AddToCartButton = ({ product }: { product: HttpTypes.StoreProduct }) => {
  const { countryCode } = useParams() as { countryCode: string }
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)

  const variants = product.variants ?? []
  const options = product.options ?? []
  const stop = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const add = async (variantId?: string) => {
    if (!variantId) return
    setAdding(variantId)
    try {
      await addToCart({ variantId, quantity: 1, countryCode: countryCode || "br" })
    } catch {
      // erro silencioso no card; o cliente pode tentar de novo / abrir o produto
    } finally {
      setAdding(null)
      setOpen(false)
    }
  }

  // 1 variante → 1 clique
  if (variants.length === 1) {
    const v = variants[0]
    const disabled = !inStock(v)
    return (
      <Button
        variant="secondary"
        className="w-full mt-3"
        disabled={disabled || !!adding}
        isLoading={!!adding}
        onClick={(e) => {
          stop(e)
          if (!disabled) add(v.id)
        }}
      >
        {disabled ? "Esgotado" : "Adicionar ao carrinho"}
      </Button>
    )
  }

  // multi-dimensão (ex.: Tamanho + Cor) ou sem opções no payload → vai pro produto
  if (options.length !== 1 || variants.length === 0) {
    return (
      <Button
        variant="secondary"
        className="w-full mt-3"
        onClick={(e) => {
          stop(e)
          router.push(`/${countryCode || "br"}/products/${product.handle}`)
        }}
      >
        Ver opções
      </Button>
    )
  }

  // 1 dimensão (Tamanho) → quick-select inline
  const values = (options[0].values ?? []).map((x: any) => x.value)
  const variantForValue = (value: string) =>
    variants.find((v) => (v.options ?? []).some((o: any) => o.value === value))

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="w-full mt-3"
        onClick={(e) => {
          stop(e)
          setOpen(true)
        }}
      >
        Comprar
      </Button>
    )
  }

  return (
    <div className="mt-3" onClick={stop}>
      <span className="text-xs text-ui-fg-subtle mb-1 block">Escolha o tamanho:</span>
      <div className="flex flex-wrap gap-1.5">
        {values.map((value) => {
          const v = variantForValue(value)
          const disabled = !inStock(v)
          return (
            <button
              key={value}
              type="button"
              disabled={disabled || !!adding}
              onClick={(e) => {
                stop(e)
                if (!disabled) add(v?.id)
              }}
              className={
                "border rounded-rounded px-2.5 py-1 text-xs transition " +
                (disabled
                  ? "border-ui-border-base text-ui-fg-disabled line-through cursor-not-allowed"
                  : "border-ui-border-base hover:border-ui-border-interactive " +
                    (adding === v?.id ? "opacity-60" : ""))
              }
            >
              {value}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default AddToCartButton
