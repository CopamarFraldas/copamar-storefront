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
import ChegaAmanha from "@modules/shipping/components/chega-amanha"
import TamanhosIrmaos from "@modules/products/components/tamanhos-irmaos"
import BreadcrumbPdp from "@modules/products/components/breadcrumb-pdp"
import SecoesProduto from "@modules/products/components/secoes-produto"
import BeneficiosCompra from "@modules/products/components/beneficios-compra"
import SeloAbsorcao from "@modules/common/components/selo-absorcao"
import Spin360 from "@modules/products/components/spin-360"
import { Ga4ViewItem } from "@modules/common/components/ga4-ecommerce"
import { getProductPrice } from "@lib/util/get-product-price"
import AvaliacoesProduto from "@modules/products/components/avaliacoes"
import CompreJunto from "@modules/products/components/compre-junto"
import type { ReviewsAgg } from "@lib/data/reviews"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  /** agregado de avaliações (server-side, cacheado) — estrelas no topo */
  reviewsAgg?: ReviewsAgg | null
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
  reviewsAgg,
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
      {/* GA4 view_item (funil e-commerce, auditoria 02/07) */}
      <Ga4ViewItem product={product} />
      {/* ORDEM MOBILE (Marco 07/06) = ORDEM DO DOM via flex-col + order:
          título → imagens → comprar/CEP → descrição.
          DESKTOP = 3 ZONAS estilo Amazon (Marco 09/06): ESQUERDA = galeria + 360
          (STICKY, foto grande); MEIO = título grande + descrição (a coluna que
          rola); DIREITA = box de compra (STICKY, enriquecido com benefícios).
          As duas laterais grudam no scroll → sem vazio e a largura é bem usada. */}
      <div
        className="content-container flex flex-col py-6 small:grid small:grid-cols-[minmax(340px,440px)_minmax(0,1fr)_minmax(310px,350px)] small:items-start small:gap-x-8"
        data-testid="product-container"
        data-track-sku={product.handle || undefined}
        data-track-categoria={trackCategoria || undefined}
        data-track-preco={trackPreco != null ? String(trackPreco) : undefined}
      >
        {/* 1. título — mobile: topo · desktop: coluna do MEIO, em cima da descrição */}
        <div className="order-1 w-full pt-2 small:order-none small:col-start-2 small:row-start-1 small:pt-0">
          <ProductInfo
            product={product}
            parte="cabecalho"
            reviewsAgg={reviewsAgg}
            countryCode={countryCode}
          />
        </div>

        {/* 2. galeria + 360 — coluna ESQUERDA, STICKY, foto grande */}
        <div className="order-2 block w-full relative pt-4 small:order-none small:col-start-1 small:row-start-1 small:row-span-2 small:self-start small:pt-0 small:sticky small:top-24">
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

        {/* 3. tamanhos → comprar → CEP + benefícios — coluna DIREITA, STICKY */}
        <div className="order-3 flex w-full flex-col gap-y-8 py-8 small:order-none small:col-start-3 small:row-start-1 small:row-span-2 small:self-start small:py-0 small:sticky small:top-24">
          <ProductOnboardingCta />
          {/* tamanhos irmãos (P·M·G·EG) — religa os produtos da mesma família */}
          <TamanhosIrmaos product={product} countryCode={countryCode} />
          {/* nível de absorção (#87) — bloco rico; null se não houver nível validado */}
          <SeloAbsorcao product={product} variante="pdp" />
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
              real com o peso da variante; lista completa de modalidades.
              ouvirPdp: reage à variante/quantidade do ProductActions (recota ao
              mudar a quantidade — antes travava em 1 unidade, Marco 23/06). */}
          {/* 🚚 "Chega AMANHÃ até as Xh" — só com CEP salvo NA ZONA de entrega
              de amanhã (backend decide; corte calculado no servidor). Fica
              colado no consultor de frete, que é quem colhe o CEP. */}
          <ChegaAmanha className="-mb-4" />
          <FreteCep variantId={product.variants?.[0]?.id} ouvirPdp />
          {/* benefícios/confiança — preenche e enriquece o box (Marco 09/06) */}
          <BeneficiosCompra />
        </div>

        {/* 4. seções em BARRAS NIVELADAS — coluna do MEIO, abaixo do título.
              Descrição/Especificações/Entrega */}
        <div className="order-4 w-full py-4 small:order-none small:col-start-2 small:row-start-2 small:py-0 small:mt-8">
          <SecoesProduto product={product} />
        </div>
      </div>
      {/* Compre Junto (Manus 10/07): complementos de higiene, curadoria fixa */}
      <Suspense fallback={null}>
        <CompreJunto product={product} countryCode={countryCode} />
      </Suspense>
      {/* Avaliações first-party (estrelinhas 1-5 + comentários) — client-side
          pelo proxy /api/reviews (a PDP é cacheada; a seção fica sempre fresca) */}
      <AvaliacoesProduto productId={product.id} />
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
