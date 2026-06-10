import { Metadata } from "next"
import { JsonLd } from "@modules/common/components/structured-data"

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const { getSiteUrl } = await import("@lib/util/seo")
  return {
    title: "Contato",
    description:
      "Fale com a Copamar Fraldas: WhatsApp (11) 95205-0000, e-mail vendas@copamarfraldas.com.br. Rua Iugoslávia, 167 — Parque das Nações, Santo André/SP. Seg a Sex, 08h às 17h.",
    alternates: { canonical: `${getSiteUrl()}/${countryCode}/contato` },
  }
}

const WHATS_ATENDENTE = "https://wa.me/5511952050000"
const WHATS_FIXO = "https://wa.me/551141190201"
const WHATS_MAPA = "https://wa.me/551149903013"
const EMAIL = "vendas@copamarfraldas.com.br"

// @id estável da Organization (produção) — identificador, não URL navegável
// (mesma convenção do structured-data do layout raiz).
const SITE_URL = "https://copamarfraldas.com.br"

function mapsUrl(query: string) {
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(query)
  )
}

/**
 * A Copamar tem UMA unidade: a matriz da Rua Iugoslávia, em Santo André/SP.
 * (Confirmado pelo Marco em 10/06: o site velho listava "Araras" e "Vila
 * Bastos", mas Araras é uma loja do PAI dele — não tem relação com a Copamar —
 * e a "unidade 3" on-line não existe. NÃO re-adicionar essas no futuro.)
 *
 * Matriz: "Rua Iugoslávia, 167 / Parque das Nações. Santo André/SP"
 *   Fones (11) 2989-6895 / (11) 3565-1880 / (11) 4119-0201
 *   Horário (confirmado Marco 10/06): Seg a Sex 08:00–17:00, Sáb 09:00–12:00.
 *   Fecha em feriados, mas atende em emendas/pontes.
 */
const UNIDADES = [
  {
    id: "unidade-matriz",
    nome: "Matriz · Santo André",
    rua: "Rua Iugoslávia, 167",
    bairroCidade: "Parque das Nações · Santo André/SP",
    telefones: ["(11) 2989-6895", "(11) 3565-1880", "(11) 4119-0201"],
    horario: [
      "Segunda a Sexta: 08:00–17:00",
      "Sábado: 09:00–12:00",
      "Fechado em feriados — atendemos em emendas e pontes",
    ],
    mapsQuery:
      "Rua Iugoslávia, 167 - Parque das Nações, Santo André - SP",
    schema: {
      streetAddress: "Rua Iugoslávia, 167 - Parque das Nações",
      addressLocality: "Santo André",
      postalCode: "09280-110",
      openingHours: [
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
      ],
      // ponto da Rua Iugoslávia no OSM/Nominatim (mesmo do layout raiz)
      geo: {
        "@type": "GeoCoordinates",
        latitude: "-23.6363979",
        longitude: "-46.5147893",
      },
    },
  },
] as const

/**
 * JSON-LD LocalBusiness da matriz. O layout raiz já injeta o #localbusiness
 * global — aqui a matriz ganha @id próprio (#unidade-matriz) ligado à
 * Organization, reforçando o SEO local / GEO. (Estrutura em map() mantida
 * caso a Copamar abra outra loja própria no futuro.)
 */
function unidadesJsonLd() {
  return UNIDADES.map((u) => ({
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Store"],
    "@id": `${SITE_URL}/#${u.id}`,
    name: `Copamar Fraldas — ${u.nome}`,
    url: SITE_URL,
    email: EMAIL,
    priceRange: "$$",
    // E.164 derivado dos MESMOS fones do card (NAP idêntico visível×estruturado)
    telephone: u.telefones.map((t) => `+55${t.replace(/\D/g, "")}`),
    address: {
      "@type": "PostalAddress",
      streetAddress: u.schema.streetAddress,
      addressLocality: u.schema.addressLocality,
      addressRegion: "SP",
      addressCountry: "BR",
      ...("postalCode" in u.schema && u.schema.postalCode
        ? { postalCode: u.schema.postalCode }
        : {}),
    },
    ...("geo" in u.schema && u.schema.geo ? { geo: u.schema.geo } : {}),
    ...(u.schema.openingHours
      ? { openingHoursSpecification: u.schema.openingHours }
      : {}),
    hasMap: mapsUrl(u.mapsQuery),
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
  }))
}

/**
 * Página de CONTATO (Marco 04/06 — link existia no pós-compra mas a página não).
 * Reformulada no garimpo #8 (10/06) com o NAP das 3 UNIDADES do site oficial
 * antigo (/contacts) + telefone/WhatsApp (11) 4119-0201. Mobile-first, direto.
 */
export default function ContatoPage() {
  return (
    <div className="content-container max-w-3xl py-10 small:py-16">
      <JsonLd data={unidadesJsonLd()} />

      <h1 className="text-3xl font-bold text-ui-fg-base mb-2">Fale com a gente</h1>
      <p className="text-ui-fg-subtle mb-8">
        Empresa familiar de Santo André/SP, especialista em fraldas geriátricas
        desde 2006. Atendemos de verdade — por WhatsApp, telefone, e-mail ou na
        nossa loja.
      </p>

      {/* Canais diretos */}
      <h2 className="text-lg font-semibold text-ui-fg-base mb-3">
        Canais de atendimento
      </h2>
      <div className="grid grid-cols-1 gap-4 small:grid-cols-2">
        {/* WhatsApp humano */}
        <a
          href={WHATS_ATENDENTE}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-ui-border-base p-5 transition hover:border-[#25d366] hover:shadow-md"
        >
          <p className="text-sm font-semibold text-ui-fg-base">💬 WhatsApp — atendente</p>
          <p className="mt-1 text-xl font-bold text-[#25d366]">(11) 95205-0000</p>
          <p className="mt-1 text-xs text-ui-fg-subtle">Seg a Sex · 08h às 17h</p>
        </a>

        {/* WhatsApp / telefone fixo */}
        <a
          href={WHATS_FIXO}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-ui-border-base p-5 transition hover:border-[#25d366] hover:shadow-md"
        >
          <p className="text-sm font-semibold text-ui-fg-base">💬 WhatsApp e telefone</p>
          <p className="mt-1 text-xl font-bold text-[#25d366]">(11) 4119-0201</p>
          <p className="mt-1 text-xs text-ui-fg-subtle">
            Também atende ligação · horário comercial
          </p>
        </a>

        {/* MAPA 24h */}
        <a
          href={WHATS_MAPA}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-ui-border-base p-5 transition hover:border-[#25d366] hover:shadow-md"
        >
          <p className="text-sm font-semibold text-ui-fg-base">🤖 WhatsApp — Mapa (assistente virtual)</p>
          <p className="mt-1 text-xl font-bold text-[#25d366]">(11) 4990-3013</p>
          <p className="mt-1 text-xs text-ui-fg-subtle">Todos os dias · 24h — tira dúvidas e anota pedidos</p>
        </a>

        {/* e-mail */}
        <a
          href={`mailto:${EMAIL}`}
          className="rounded-xl border border-ui-border-base p-5 transition hover:border-copamar-primary hover:shadow-md"
        >
          <p className="text-sm font-semibold text-ui-fg-base">✉️ E-mail</p>
          <p className="mt-1 break-all text-lg font-bold text-copamar-primary">{EMAIL}</p>
          <p className="mt-1 text-xs text-ui-fg-subtle">Respondemos em horário comercial</p>
        </a>
      </div>

      {/* Loja física */}
      <h2 className="mt-10 text-lg font-semibold text-ui-fg-base mb-3">
        Onde estamos
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {UNIDADES.map((u) => (
          <div
            key={u.id}
            className="rounded-xl border border-ui-border-base p-5"
          >
            <p className="text-sm font-semibold text-copamar-primary">
              📍 {u.nome}
            </p>
            <a
              href={mapsUrl(u.mapsQuery)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-base font-semibold text-ui-fg-base leading-snug hover:underline"
            >
              {u.rua}
              <br />
              {u.bairroCidade}
              <span className="ml-1 text-xs font-normal text-ui-fg-subtle">
                · ver no mapa →
              </span>
            </a>
            <p className="mt-2 text-sm text-ui-fg-base">
              {u.telefones.map((tel, i) => (
                <span key={tel}>
                  {i > 0 && <span className="text-ui-fg-subtle"> · </span>}
                  <a
                    href={`tel:+55${tel.replace(/\D/g, "")}`}
                    className="hover:text-copamar-primary hover:underline"
                  >
                    {tel}
                  </a>
                </span>
              ))}
            </p>
            <p className="mt-1 text-xs text-ui-fg-subtle">
              {u.horario.join(" · ")}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-ui-fg-subtle">
        Copamar Fraldas · CNPJ 08.140.992/0001-64 · Há 20 anos cuidando de
        quem você ama.
      </p>
    </div>
  )
}
