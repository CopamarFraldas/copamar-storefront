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
      // redes de segurança pro cutover (garimpo #2/#5): NENHUMA URL antiga vira
      // 404 seco. Query strings (?p=, ?dir=, ?q=...) são ignoradas no match e
      // preservadas no destino por padrão do Next (garimpo #3). Estas wildcard
      // vêm DEPOIS do mapa: as regras 1-pra-1 (ex.: blog) têm precedência.
      { source: "/index.php/:path*", destination: "/:path*", statusCode: 301 },
      { source: "/catalogsearch/:path*", destination: "/br/search", statusCode: 301 },
      { source: "/marcas/:path*", destination: "/br", statusCode: 301 },
      { source: "/blog/:path*", destination: "/br/blog", statusCode: 301 },
      { source: "/:path*.html", destination: "/br", statusCode: 301 },
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
