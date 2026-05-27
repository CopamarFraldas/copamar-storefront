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
