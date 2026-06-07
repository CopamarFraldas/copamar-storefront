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
      {/* ORDEM MOBILE (Marco 07/06, padrão Tena/Amazon) é a ORDEM DO DOM —
          título → imagens → comprar/CEP → descrição colapsada — robusta a
          qualquer CSS (nada de display:contents/order, que quebrava com CSS
          cacheado no celular). Desktop (small:) vira GRID 3 colunas:
          esquerda = título+descrição · centro = galeria · direita = ações. */}
      <div
        className="content-container py-6 relative small:grid small:grid-cols-[300px_1fr_300px] small:grid-rows-[auto_1fr] small:items-start small:gap-x-8"
        data-testid="product-container"
        data-track-sku={product.handle || undefined}
        data-track-categoria={trackCategoria || undefined}
        data-track-preco={trackPreco != null ? String(trackPreco) : undefined}
      >
        {/* 1. título (mobile: topo · desktop: coluna esquerda, linha 1) */}
        <div className="w-full pt-2 small:pt-0 small:col-start-1 small:row-start-1">
          <ProductInfo product={product} parte="cabecalho" />
        </div>

        {/* 2. galeria + 360 (mobile: logo após o título · desktop: centro) */}
        <div className="block w-full relative pt-4 small:pt-0 small:col-start-2 small:row-start-1 small:row-span-2">
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

        {/* 3. tamanhos → comprar → CEP (desktop: coluna direita, sticky) */}
        <div className="flex flex-col w-full py-8 gap-y-12 small:py-0 small:col-start-3 small:row-start-1 small:row-span-2 small:sticky small:top-48 small:self-start">
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

        {/* 4. descrição/specs/abas POR ÚLTIMO no mobile, colapsadas
              (desktop: coluna esquerda, linha 2, sempre abertas) */}
        <div className="w-full py-4 small:py-0 small:col-start-1 small:row-start-2 small:mt-6">
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
