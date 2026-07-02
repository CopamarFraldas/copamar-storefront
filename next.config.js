const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Foto do comprovante de entrega (camera real = 5-15MB) — o default de 1MB
  // dava 413 e o motorista nao conseguia confirmar (incidente 11/06)
  experimental: {
    serverActions: { bodySizeLimit: "15mb" },
  },
  // ── 301 do Magento → site novo (#62, caminho crítico do cutover) ──
  // Mapa gerado da migração (sitemap antigo crawleado + matching contra o
  // catálogo novo + revisão multi-agente). Reviewável em redirects-magento.csv
  // (gdrive). Ativo também no staging (as rotas antigas não existem aqui, então
  // não conflita com nada) — no cutover o mesmo código atende o domínio real.
  async redirects() {
    const mapa = require("./redirects-magento.json")
    // statusCode: 301 explícito (não `permanent:true`, que emite 308). Pro
    // Google 308≡301 desde 2016, mas ferramentas de auditoria e bots antigos
    // reconhecem melhor o 301 — e é o que o runbook do cutover documenta.
    // OBS: os sources do mapa NÃO têm trailing slash — o Next normaliza /x/ → /x
    // ANTES de aplicar redirects, então regra com barra nunca casaria (bug
    // pego no teste: /blog/slug/ caía no wildcard → índice em vez do artigo).
    return [
      // host www → apex (garimpo #4): sem isso, até os 301 morrem sob www.
      // PRIMEIRA da lista — vale pra qualquer path, preservando-o.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.copamarfraldas.com.br" }],
        destination: "https://copamarfraldas.com.br/:path*",
        statusCode: 301,
      },
      ...mapa.map((r) => ({
        source: r.source,
        destination: r.destination,
        statusCode: 301,
      })),
      // Descontinuados sem 301 (Merchant "página indisponível", Marco 18/06):
      // produtos soft-deletados cujo HANDLE NOVO /br/products/* dá 404 (os .html
      // antigos já caem no catch-all). Tena Men Lv3 já tem 301 no mapa → não mexer.
      // → categoria relevante (ad/SEO/Merchant não cai em 404).
      {
        source: "/br/products/fralda-geriatrica-comfort-life-basic-g-50-unidades",
        destination: "/br/categories/fraldas-geriatricas",
        statusCode: 301,
      },
      {
        source: "/br/products/absorvente-geriatrico-geriaplus-c-50-azul",
        destination: "/br/categories/absorvente-geriatrico",
        statusCode: 301,
      },
      // ── 12 das 14 .html legítimas do Search Console 404 (validado c/ Marco 01/07;
      //    as outras 2 lady-discreet→tena-pants-mulher já estavam no mapa). O resto
      //    do export (984) é lixo de sessão ?___SID / dropdown-toggle → 404 limpo. ──
      // EXISTE (produto atual; contagem/tamanho antigo descontinuado):
      { source: "/fralda-geriatrica-tena-slip-noturna-24-unidades-grande.html", destination: "/br/products/fralda-slip-noturna-grande-c-32-unidades", statusCode: 301 },
      { source: "/tena-pants-noturna-g-eg-com-16-unidades.html", destination: "/br/products/tena-pants-noturna-g-eg-c-32", statusCode: 301 },
      { source: "/tena-pants-noturna-g-eg-com-24-unidades.html", destination: "/br/products/tena-pants-noturna-g-eg-c-32", statusCode: 301 },
      // DESCONTINUADO, ou slug sem tamanho → categoria (alvo seguro):
      { source: "/fralda-geriatrica-tena-slip-noturna-24-unidades.html", destination: "/br/categories/fraldas-geriatricas-tena", statusCode: 301 },
      { source: "/fralda-geriatrica-comfort-life-super-premium-776.html", destination: "/br/categories/fraldas-geriatricas-outras", statusCode: 301 },
      { source: "/fralda-geriatrica-eg-comfort-life-super-premium-com-16.html", destination: "/br/categories/fraldas-geriatricas-outras", statusCode: 301 },
      { source: "/fralda-de-vestir.html", destination: "/br/categories/roupa-intima", statusCode: 301 },
      { source: "/fralda-geriatrica-de-vestir-sensaty-eg.html", destination: "/br/categories/roupa-intima", statusCode: 301 },
      { source: "/fralda-personal-baby-:slug*", destination: "/br/categories/fralda-infantil", statusCode: 301 },
      // redes de segurança pro cutover (garimpo #2/#5): NENHUMA URL antiga vira
      // 404 seco. Query strings (?p=, ?dir=, ?q=...) são ignoradas no match e
      // preservadas no destino por padrão do Next (garimpo #3). Estas wildcard
      // vêm DEPOIS do mapa: as regras 1-pra-1 (ex.: blog) têm precedência.
      { source: "/index.php/:path*", destination: "/:path*", statusCode: 301 },
      { source: "/catalogsearch/:path*", destination: "/br/search", statusCode: 301 },
      { source: "/marcas/:path*", destination: "/br", statusCode: 301 },
      { source: "/blog/:path*", destination: "/br/blog", statusCode: 301 },
      // `/:path*.html → /br` REMOVIDO 01/07 (era soft-404 em massa = penalidade SEO).
      // .html não-mapeado agora dá 404 limpo; os 14 legítimos estão cobertos acima/no mapa.
    ]
  },

  reactStrictMode: true,
  // Esconde o Dev Indicator ("N") no canto — mantém dev mode + hot reload.
  // Erros de compile/runtime ainda aparecem. (Next 15.3: buildActivity foi deprecado; usar `false`.)
  devIndicators: false,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // AVIF antes de WebP (#54 perf): ~20% menor; o cache do optimizer absorve
    // o custo do encode. Browser sem suporte cai pro WebP automaticamente.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      // Fotos dos produtos migrados (Bling→Medusa): referência direta às origens
      // externas até o cutover (~22/06), quando migram p/ R2. Ver imagens-magento-urls.log.
      { protocol: "https", hostname: "copamarfraldas.com.br" },
      // fotos oficiais Tena/Essity (CDN VTEX) — refs externas até o cutover
      { protocol: "https", hostname: "tenabr.vtexassets.com" },
      { protocol: "https", hostname: "http2.mlstatic.com" },
      { protocol: "https", hostname: "www.fraldasgeriatrica.com.br" },
      // Fotos migradas pro Cloudflare R2 (Fase S1.5) — destino definitivo das imagens
      { protocol: "https", hostname: "pub-f7ff94baf2ca454da81e5b100b79ba92.r2.dev" },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}

// Sentry (#67): wrap pro build instrumentado. Upload de SOURCE MAPS só
// acontece quando SENTRY_AUTH_TOKEN estiver setado (server-side, fora do git)
// — sem o token o build segue normal, apenas sem stack traces des-minificados.
const { withSentryConfig } = require("@sentry/nextjs")
module.exports = withSentryConfig(nextConfig, {
  org: "copamar-distribuidora-e-atacad",
  project: "javascript-nextjs",
  silent: true,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  disableLogger: true,
})
