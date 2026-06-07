import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"
import FreteCep from "@modules/shipping/components/frete-cep"
import TamanhosIrmaos from "@modules/products/components/tamanhos-irmaos"
import BreadcrumbPdp from "@modules/products/components/breadcrumb-pdp"
import DescricaoExpansivel from "@modules/products/components/descricao-expansivel"
import Spin360 from "@modules/products/components/spin-360"
import ProductSpecs from "@modules/products/components/product-specs"
import { getProductPrice } from "@lib/util/get-product-price"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  // data-attributes pro copamar-track.js capturar categoria/preço no product_view
  // (hoje vêm NULL). sku = handle, mantendo a chave que o feed usa pra enriquecer.
  const { cheapestPrice } = getProductPrice({ product })
  const trackPreco = cheapestPrice?.calculated_price_number
  const trackCategoria = (product.categories?.[0] as any)?.name

  return (
    <>
      {/* breadcrumb visível: caminho de volta pra categoria (#54 linking) */}
      <BreadcrumbPdp product={product} />
      <div
        className="content-container  flex flex-col small:flex-row small:items-start py-6 relative"
        data-testid="product-container"
        data-track-sku={product.handle || undefined}
        data-track-categoria={trackCategoria || undefined}
        data-track-preco={trackPreco != null ? String(trackPreco) : undefined}
      >
        {/* ORDEM MOBILE (Marco 07/06, padrão Tena/Amazon): título → imagens →
            tamanhos/comprar/CEP → descrição COLAPSADA. No desktop nada muda:
            `contents` no mobile promove os netos ao flex do container (cada um
            com seu `order`); em small: vira a coluna esquerda de sempre. */}
        <div className="contents small:flex small:flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] small:w-full small:gap-y-6">
          <div className="order-1 small:order-none w-full pt-4 small:pt-0">
            <ProductInfo product={product} parte="cabecalho" />
          </div>
          <div className="order-4 small:order-none w-full py-6 small:py-0 flex flex-col gap-y-6">
            <DescricaoExpansivel>
              <div className="flex flex-col gap-y-6">
                <ProductInfo product={product} parte="descricao" />
                {/* specs factuais em tabela (GEO/AEO #54) */}
                <ProductSpecs product={product} />
                <ProductTabs product={product} />
              </div>
            </DescricaoExpansivel>
          </div>
        </div>
        <div className="order-2 small:order-none block w-full relative pt-4 small:pt-0">
          <ImageGallery images={images} title={product.title} />
          {/* 🌀 giro 360° oficial (Marco 07/06) — produtos com metadata.spin360 */}
          {(product.metadata as any)?.spin360 && (
            <div className="mt-4">
              <Spin360
                basePath={String((product.metadata as any).spin360)}
                alt={product.title}
              />
            </div>
          )}
        </div>
        <div className="order-3 small:order-none flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-12">
          <ProductOnboardingCta />
          {/* tamanhos irmãos (P·M·G·EG) — religa os produtos da mesma família */}
          <TamanhosIrmaos product={product} countryCode={countryCode} />
          <Suspense
            fallback={
              <ProductActions
                disabled={true}
                product={product}
                region={region}
              />
            }
          >
            <ProductActionsWrapper id={product.id} region={region} />
          </Suspense>
          {/* consultor de frete por CEP (nº1 + parte do nº4 da PDP) — cotação
              real com o peso da variante; lista completa de modalidades. */}
          <FreteCep variantId={product.variants?.[0]?.id} />
        </div>
      </div>
      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
