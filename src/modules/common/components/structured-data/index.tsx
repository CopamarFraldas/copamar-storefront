/**
 * Schema.org (JSON-LD) — dados estruturados pra SEO/GEO (Copamar Fraldas).
 * Dados oficiais confirmados via Receita Federal (24/05/2026).
 * SITE_URL = domínio canônico de produção (mesmo em staging — correto pro SEO).
 */

const SITE_URL = "https://copamarfraldas.com.br"

// NAP — bate EXATO com o Google Negócios (bairro no streetAddress; schema.org
// PostalAddress não tem campo de bairro próprio).
const ENDERECO = {
  "@type": "PostalAddress",
  streetAddress: "Rua Iugoslávia, 167 - Parque das Nações",
  addressLocality: "Santo André",
  addressRegion: "SP",
  postalCode: "09280-110",
  addressCountry: "BR",
} as const

const HORARIOS = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "08:00",
    closes: "17:00",
  },
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: "Saturday",
    opens: "09:00",
    closes: "12:00",
  },
] as const

/**
 * AggregateRating fica SÓ na Organization/LocalBusiness (rating em produto
 * individual sem reviews reais = penalidade do Google). ⚠️ NÃO FABRICAR: só
 * emite com a CONTAGEM REAL de avaliações. Defina NEXT_PUBLIC_REVIEW_COUNT com o
 * nº real do Google Negócios pra ativar (snapshot real abaixo: 4,6 / 143).
 */
// Snapshot REAL do Google Negócios (perfil público, 31/05/2026): 4,6 / 143
// avaliações. (NÃO confundir com o seller rating 4,9 do Merchant Center — métrica
// diferente.) TODO #42: ligar no Places API pra manter atualizado automaticamente.
const REVIEW_RATING = process.env.NEXT_PUBLIC_REVIEW_RATING || "4.6"
const REVIEW_COUNT: number | null = process.env.NEXT_PUBLIC_REVIEW_COUNT
  ? parseInt(process.env.NEXT_PUBLIC_REVIEW_COUNT, 10) || null
  : 143
const aggregateRating = () =>
  REVIEW_COUNT
    ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: REVIEW_RATING,
          reviewCount: REVIEW_COUNT,
          bestRating: "5",
        },
      }
    : {}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Copamar Fraldas",
    legalName:
      "Copamar Distribuidora e Atacadista de Fraldas e Produtos de Higiene LTDA",
    url: SITE_URL,
    logo: `${SITE_URL}/logo-512.png`,
    image: `${SITE_URL}/og-image.png`,
    foundingDate: "2006-05-16",
    foundingLocation: {
      "@type": "Place",
      name: "Tucuruvi, São Paulo",
      address: {
        "@type": "PostalAddress",
        addressLocality: "São Paulo",
        addressRegion: "SP",
        addressCountry: "BR",
      },
    },
    slogan: "Cuidado e dignidade pra quem você ama",
    description:
      "Distribuidora atacadista especializada em fraldas geriátricas e produtos de higiene para idosos. Empresa familiar com 20 anos de tradição (fundada em 2006), com sede atual em Santo André/SP. Atendemos cuidadores familiares e profissionais de saúde (asilos, casas de repouso, home care) com parcelamento em até 3x sem juros, 5% de desconto no pagamento à vista, e entregas para todo o Brasil.",
    knowsAbout: [
      "fralda geriátrica",
      "fralda para idoso",
      "fralda para acamado",
      "produtos de higiene geriátrica",
      "incontinência urinária",
      "cuidado de idosos",
    ],
    founder: {
      "@type": "Person",
      name: "Francisco Antônio Nascimento Junior",
      alternateName: "Seu Francisco",
      jobTitle: "Fundador e Consultor Honorário",
      description:
        "Fundou a Copamar em 2006 no bairro do Tucuruvi, zona norte de São Paulo. Pivotou a loja generalista para especialização em fraldas geriátricas. Hoje atua como consultor honorário.",
    },
    employee: [
      {
        "@type": "Person",
        name: "Marco Aurellio Berco Nascimento",
        jobTitle:
          "Sócio-Administrador, Diretor de Estratégia e Operações Digitais",
        alumniOf: {
          "@type": "EducationalOrganization",
          name: "Fundação Getulio Vargas (FGV)",
        },
        description:
          "Filho do fundador, assumiu a direção da Copamar em 2021 junto ao irmão Paulo. Formado em Administração pela FGV. Responsável por estratégia, operação digital (e-commerce, sistemas, automações) e atendimento na loja física.",
      },
      {
        "@type": "Person",
        name: "Paulo Henrique Berco Nascimento",
        jobTitle: "Sócio-Administrador, Gestão de Atendimento e Varejo",
        description:
          "Filho do fundador, assumiu a direção da Copamar em 2021 junto ao irmão Marco. Em aperfeiçoamento constante via G4 Educação. Responsável por modernização do atendimento, gestão de varejo e relacionamento direto com cuidadores na loja física.",
      },
    ],
    address: ENDERECO,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+5511952050000",
      contactType: "customer service",
      areaServed: "BR",
      availableLanguage: "Portuguese",
      hoursAvailable: HORARIOS,
    },
    sameAs: [
      "https://www.instagram.com/copamarfraldas/",
      "https://www.facebook.com/fraldageriatrica",
    ],
    taxID: "08.140.992/0001-64",
    areaServed: { "@type": "Country", name: "Brasil" },
    ...aggregateRating(),
  }
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#localbusiness`,
    name: "Copamar Fraldas - Loja Física",
    image: `${SITE_URL}/loja-fachada-square.jpg`,
    telephone: "+5511952050000",
    url: SITE_URL,
    priceRange: "$$",
    address: ENDERECO,
    geo: {
      "@type": "GeoCoordinates",
      latitude: "-23.6363979",
      longitude: "-46.5147893",
    },
    openingHoursSpecification: HORARIOS,
    ...aggregateRating(),
  }
}

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "Copamar Fraldas",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
}

export type BreadcrumbItem = { name: string; url: string }

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export type ProductSchemaInput = {
  name: string
  description?: string
  image?: string | string[]
  sku?: string
  /** GTIN/EAN-13 real (variant.barcode/ean). Sem rating em produto (guardrail). */
  gtin?: string
  brand?: string
  url?: string
  price?: number | string
  currency?: string
  availability?: string
}

export function productSchema(product: ProductSchemaInput) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
  }
  // GTIN real (EAN-13) — forte sinal pro Google Shopping/GEO. Só com 13 dígitos.
  if (product.gtin && /^\d{13}$/.test(product.gtin)) {
    schema.gtin13 = product.gtin
  }
  if (product.brand) {
    schema.brand = { "@type": "Brand", name: product.brand }
  }
  if (product.price != null) {
    schema.offers = {
      "@type": "Offer",
      price: String(product.price),
      priceCurrency: product.currency || "BRL",
      availability:
        product.availability || "https://schema.org/InStock",
      url: product.url,
      seller: { "@id": `${SITE_URL}/#organization` },
    }
  }
  return schema
}

export type FaqItem = { pergunta: string; resposta: string }

export function faqPageSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.pergunta,
      acceptedAnswer: { "@type": "Answer", text: f.resposta },
    })),
  }
}

export type ArticleSchemaInput = {
  title: string
  description: string
  url: string
  image?: string
  publishedAt: string
  updatedAt?: string
  author?: string
}

export function articleSchema(article: ArticleSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: article.image ? [article.image] : undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      "@type": "Organization",
      name: article.author || "Equipe Copamar",
      "@id": `${SITE_URL}/#organization`,
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": article.url },
  }
}

export function aboutPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE_URL}/sobre#aboutpage`,
    url: `${SITE_URL}/sobre`,
    name: "Quem somos — Copamar Fraldas",
    description:
      "A história da Copamar Fraldas: empresa familiar de Santo André/SP, fundada em 2006, especializada em fraldas geriátricas e produtos de higiene para idosos há 20 anos.",
    mainEntity: { "@id": `${SITE_URL}/#organization` },
  }
}

/** Injeta um ou mais blocos JSON-LD na página. */
export function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data]
  return (
    <>
      {items.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  )
}

/** Schemas globais (Organization + LocalBusiness + WebSite) — layout raiz. */
export default function StructuredData() {
  return <JsonLd data={[organizationSchema(), localBusinessSchema(), webSiteSchema()]} />
}
