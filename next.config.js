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
  // ── 301 do Magento → site novo (#62, caminho crítico do cutover) ──
  // Mapa gerado da migração (sitemap antigo crawleado + matching contra o
  // catálogo novo + revisão multi-agente). Reviewável em redirects-magento.csv
  // (gdrive). Ativo também no staging (as rotas antigas não existem aqui, então
  // não conflita com nada) — no cutover o mesmo código atende o domínio real.
  async redirects() {
    const mapa = require("./redirects-magento.json")
    return [
      ...mapa.map((r) => ({
        source: r.source,
        destination: r.destination,
        permanent: true, // 301
      })),
      // redes de segurança pro cutover: NENHUMA URL antiga vira 404.
      // (nenhuma rota nova usa .html; /blog/<slug> antigo não-mapeado → índice)
      { source: "/blog/:path*", destination: "/br/blog", permanent: true },
      { source: "/:path*.html", destination: "/br", permanent: true },
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

module.exports = nextConfig
