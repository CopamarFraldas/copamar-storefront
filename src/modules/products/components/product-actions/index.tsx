"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const countryCode = useParams().countryCode as string

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    // FARDO (06/06): a PDP do fardo é um ATALHO — põe N unidades da UNIDADE
    // no carrinho (preço de atacado vem do tier por quantidade). Fardo e
    // avulso saem do MESMO estoque físico; assim a baixa é sempre na unidade
    // (anti-oversell por construção).
    const meta = (product.metadata || {}) as any
    const fardoVariant = meta.fardo_de_variant as string | undefined
    const fardoN = Number(meta.fardo_n) || 0

    await addToCart({
      variantId: fardoVariant && fardoN > 0 ? fardoVariant : selectedVariant.id,
      quantity: fardoVariant && fardoN > 0 ? fardoN : 1,
      countryCode,
    })

    setIsAdding(false)
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        <ProductPrice product={product} variant={selectedVariant} />

        {/* selo ESGOTADO + aviso (metadata.aviso_estoque editável na ADM).
            Só aparece quando o produto está REALMENTE esgotado:
            - todas as variants sem estoque (esgotado de verdade), OU
            - variant escolhida e essa específica está sem estoque.
            Evita o falso positivo de mostrar "Esgotado" antes do cliente
            escolher uma variação (estado em que selectedVariant é undefined). */}
        {(() => {
          const variants = (product?.variants || []) as any[]
          const todasEsgotadas = variants.length > 0 && variants.every((v) => {
            if (!v.manage_inventory) return false
            if (v.allow_backorder) return false
            return (v.inventory_quantity || 0) === 0
          })
          const variantEscolhidaEsgotada = !!selectedVariant && !inStock
          const mostrar = todasEsgotadas || variantEscolhidaEsgotada
          if (!mostrar) return null
          const meta = (product?.metadata || {}) as Record<string, any>
          const aviso = typeof meta.aviso_estoque === "string" ? meta.aviso_estoque.trim() : ""
          return (
            <div className="flex flex-col gap-y-1 mb-2">
              <span className="inline-flex w-fit items-center rounded-full bg-red-600 text-white text-xs font-semibold uppercase tracking-wide px-3 py-1">
                Esgotado
              </span>
              {aviso && (
                <p className="text-sm text-ui-fg-subtle leading-snug">{aviso}</p>
              )}
            </div>
          )
        })()}

        <Button
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant && !options
            ? "Selecione a variação"
            : !inStock || !isValidVariant
            ? "Esgotado"
            : "Adicionar ao carrinho"}
        </Button>
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
