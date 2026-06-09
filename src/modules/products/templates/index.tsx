import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"
import FreteCep from "@modules/shipping/components/frete-cep"
import TamanhosIrmaos from "@modules/products/components/tamanhos-irmaos"
import BreadcrumbPdp from "@modules/products/components/breadcrumb-pdp"
import SecoesProduto from "@modules/products/components/secoes-produto"
import Spin360 from "@modules/products/components/spin-360"
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
      {/* ORDEM MOBILE (Marco 07/06) = ORDEM DO DOM via flex-col + order:
          título → imagens → comprar/CEP → descrição. DESKTOP (small:) = layout
          Mercado Livre (Marco 09/06, fim do "buraco vazio abaixo da foto"):
          coluna ESQUERDA ampla = galeria + descrição logo abaixo dela (preenche
          o espaço que antes ficava vazio); coluna DIREITA estreita = box de
          compra, STICKY (acompanha o scroll). A descrição flui sob a foto em vez
          de ficar numa coluna estreita forçando a galeria a esticar. */}
      <div
        className="content-container flex flex-col py-6 small:grid small:grid-cols-[minmax(0,1fr)_360px] small:items-start small:gap-x-10"
        data-testid="product-container"
        data-track-sku={product.handle || undefined}
        data-track-categoria={trackCategoria || undefined}
        data-track-preco={trackPreco != null ? String(trackPreco) : undefined}
      >
        {/* 1. título — mobile: topo · desktop: full-width no topo */}
        <div className="order-1 w-full pt-2 small:order-none small:col-span-2 small:pt-0">
          <ProductInfo product={product} parte="cabecalho" />
        </div>

        {/* 2. galeria + 360 — coluna ampla esquerda (a descrição vem logo abaixo) */}
        <div className="order-2 block w-full relative pt-4 small:order-none small:col-start-1 small:row-start-2 small:max-w-[560px] small:pt-0">
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

        {/* 3. tamanhos → comprar → CEP — coluna estreita direita, STICKY */}
        <div className="order-3 flex w-full flex-col gap-y-12 py-8 small:order-none small:col-start-2 small:row-start-2 small:row-span-2 small:self-start small:py-0 small:sticky small:top-24">
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

        {/* 4. seções em BARRAS NIVELADAS — coluna ampla esquerda, LOGO ABAIXO da
              galeria (preenche o antigo vazio). Descrição/Especificações/Entrega */}
        <div className="order-4 w-full py-4 small:order-none small:col-start-1 small:row-start-3 small:py-0 small:mt-8">
          <SecoesProduto product={product} />
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
