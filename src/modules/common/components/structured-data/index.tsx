/**
 * Schema.org (JSON-LD) — dados estruturados pra SEO/GEO (Copamar Fraldas).
 * Dados oficiais confirmados via Receita Federal (24/05/2026).
 * SITE_URL = domínio de produção usado como @id ESTÁVEL das entidades globais
 * (Organization/LocalBusiness/WebSite) — identificador, não URL navegável, então
 * fica estável entre staging e produção de propósito. URLs de PÁGINA (AboutPage,
 * Article, breadcrumb, Product) vêm da própria página via getSiteUrl()+/<cc>,
 * acompanhando o canonical (staging agora, produção no cutover).
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
 * ⚠️ AggregateRating REMOVIDO do JSON-LD (#42, 05/06/2026 — decisão de
 * consistência + política do Google):
 *
 * O site agora FEATURA visivelmente o Seller Rating 4,9/600 (Google Customer
 * Reviews, com link pra fonte — ver reviews-badge). Manter 4,6/143 (Maps) no
 * markup criaria inconsistência visível×estruturado; e ALINHAR o markup pro
 * 4,9 violaria a diretriz de review snippets: aggregateRating self-serving em
 * Organization/LocalBusiness deve vir de avaliações coletadas no PRÓPRIO site
 * (first-party) — nota "emprestada" do Google (Maps OU Seller Rating) é
 * justamente o que a política veda, com risco de ação manual.
 *
 * Caminho: selo visível linkado (fonte verificável) hoje; se um dia a loja
 * coletar reviews first-party, reintroduzir o markup com ESSES dados.
 * NADA fabricado.
 */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Copamar Fraldas",
    legalName:
      "Copamar Distribuidora e Atacadista de Fraldas e Produtos de Higiene Ltda - ME",
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
    sameAs: SAME_AS,
    email: "vendas@copamarfraldas.com.br",
    taxID: "08.140.992/0001-64",
    areaServed: { "@type": "Country", name: "Brasil" },
  }
}

// Perfis REAIS linkados pelo site oficial antigo (verificados 06/06/2026):
// IG/FB no footer do Magento; canal YouTube "Fraldas Geriátricas" ativo
// (HTTP 200) e linkado pelo site. NADA fabricado.
const SAME_AS = [
  "https://www.instagram.com/copamarfraldas/",
  "https://www.facebook.com/fraldageriatrica",
  "https://www.youtube.com/channel/UCMl709u_KxLuEAJPGzi2YmA",
]

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    // Store = subtipo de LocalBusiness mais específico (loja de varejo)
    "@type": ["LocalBusiness", "Store"],
    "@id": `${SITE_URL}/#localbusiness`,
    name: "Copamar Fraldas - Loja Física",
    image: `${SITE_URL}/loja-fachada-square.jpg`,
    telephone: "+5511952050000",
    email: "vendas@copamarfraldas.com.br",
    url: SITE_URL,
    priceRange: "$$",
    address: ENDERECO,
    geo: {
      // ponto da Rua Iugoslávia no OSM/Nominatim (validado 06/06/2026)
      "@type": "GeoCoordinates",
      latitude: "-23.6363979",
      longitude: "-46.5147893",
    },
    hasMap:
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent("Rua Iugoslávia, 167 - Parque das Nações, Santo André - SP"),
    openingHoursSpecification: HORARIOS,
    sameAs: SAME_AS,
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
  }
}

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "Copamar Fraldas",
    alternateName: "Copamar",
    inLanguage: "pt-BR",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      // URL real da busca inclui o prefixo de país (/br/search?q=)
      target: `${SITE_URL}/br/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
}

/**
 * SiteNavigationElement — navegação principal pro Google/IAs entenderem a
 * arquitetura do site (SEO/GEO #54 avançado). Itens = menu real da loja.
 */
export function siteNavigationSchema() {
  const itens: [string, string][] = [
    ["Loja — catálogo completo", "/br/store"],
    ["Fraldas Geriátricas", "/br/categories/fraldas-geriatricas"],
    ["Roupa Íntima Descartável (Pants)", "/br/categories/roupa-intima"],
    ["Absorventes", "/br/categories/absorventes"],
    ["Luvas Descartáveis", "/br/categories/higiene-luvas"],
    ["Protetores de Cama", "/br/categories/protetores-de-cama"],
    ["Blog", "/br/blog"],
    ["Quem Somos", "/br/sobre"],
    ["Contato", "/br/contato"],
  ]
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/#sitenavigation`,
    itemListElement: itens.map(([name, path], i) => ({
      "@type": "SiteNavigationElement",
      position: i + 1,
      name,
      url: `${SITE_URL}${path}`,
    })),
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
  /** specs FACTUAIS (tamanho/quantidade do catálogo) → additionalProperty (GEO/AEO) */
  specs?: { name: string; value: string }[]
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
  // specs estruturadas factuais (tamanho, unidades por pacote...) pra IA citar
  if (product.specs?.length) {
    schema.additionalProperty = product.specs.map((s) => ({
      "@type": "PropertyValue",
      name: s.name,
      value: s.value,
    }))
  }
  if (product.price != null) {
    schema.offers = {
      "@type": "Offer",
      price: String(product.price),
      priceCurrency: product.currency || "BRL",
      availability:
        product.availability || "https://schema.org/InStock",
      // produto novo (loja não vende usado/recondicionado)
      itemCondition: "https://schema.org/NewCondition",
      url: product.url,
      seller: { "@id": `${SITE_URL}/#organization` },
      // Frete: entrega pra todo o Brasil (fato). Valores/prazos variam por
      // CEP (frete próprio + transportadoras via cotação ao vivo) — NÃO
      // declaramos rate/prazo fixos pra não fabricar números.
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "BR",
        },
      },
      // Política REAL: desistência em 7 dias corridos (CDC art. 49) com
      // pacote lacrado; detalhes em /trocas-e-devolucoes
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "BR",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
        merchantReturnLink: `${SITE_URL}/br/trocas-e-devolucoes`,
      },
    }
  }
  return schema
}

export type FaqItem = { pergunta: string; resposta: string }

/**
 * FAQPage + speakable (GEO/voz): cssSelector aponta os blocos de FAQ reais
 * (details/summary) — assistentes de voz/IA sabem o que ler em voz alta.
 */
export function faqPageSchema(faqs: FaqItem[], speakableSelector?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "pt-BR",
    ...(speakableSelector
      ? {
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: [speakableSelector],
          },
        }
      : {}),
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
    inLanguage: "pt-BR",
    headline: article.title,
    description: article.description,
    // sempre URL absoluta (frontmatter pode trazer caminho relativo)
    image: article.image
      ? [article.image.startsWith("http") ? article.image : `${SITE_URL}${article.image}`]
      : undefined,
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

// `url` = URL REAL da página (canonical env-consciente, com /<countryCode>),
// passada pela página — assim a AboutPage acompanha o canonical (staging agora,
// produção no cutover), igual ao articleSchema. O mainEntity ainda referencia o
// @id ESTÁVEL da Organization (produção), que é identificador, não URL navegável.
export function aboutPageSchema(url: string = `${SITE_URL}/sobre`) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${url}#aboutpage`,
    url,
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

/** Schemas globais (Organization + LocalBusiness + WebSite + navegação) — layout raiz. */
export default function StructuredData() {
  return (
    <JsonLd
      data={[
        organizationSchema(),
        localBusinessSchema(),
        webSiteSchema(),
        siteNavigationSchema(),
      ]}
    />
  )
}
