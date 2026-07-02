import { MetadataRoute } from "next"

/**
 * Web App Manifest (auditoria 02/07: não existia — o /site.webmanifest que
 * respondia 200 era a home duplicada do bug soft-200). O Next gera
 * /manifest.webmanifest + o <link rel="manifest"> no head automaticamente.
 * O matcher do middleware já exclui paths começando com "manifest", então a
 * rota não passa pelo redirect de countryCode.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Copamar Fraldas",
    short_name: "Copamar",
    description:
      "Distribuidora atacadista especializada em fraldas geriátricas. 20 anos de tradição. Entregas para todo o Brasil.",
    // direto no /br evita o hop do redirect 308 da raiz ao abrir o app instalado
    start_url: "/br",
    // scope restrito ao /br: o <link rel="manifest"> que o Next injeta é GLOBAL
    // (aparece até no /entregas, o PWA do Dedé). Sem scope, re-adicionar o
    // /entregas à tela inicial instalaria "Copamar Fraldas" abrindo em /br.
    // Fora do scope o browser ignora este manifest e o /entregas mantém o
    // comportamento de atalho de sempre.
    scope: "/br",
    display: "standalone",
    lang: "pt-BR",
    background_color: "#ffffff",
    // brand.primary do tailwind.config.js
    theme_color: "#1251b8",
    icons: [
      { src: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/logo-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
