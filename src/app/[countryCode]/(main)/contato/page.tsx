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
 * NAP das 3 unidades — extraído do site oficial antigo
 * (copamarfraldas.com.br/contacts, garimpo #8 em 10/06/2026), textos VERBATIM:
 *
 * - Unidade 1 (Matriz): "Rua Iugoslávia, 167 / Parque das Nações. Santo André/SP"
 *   Fones (11) 2989-6895 / (11) 3565-1880 / (11) 4119-0201
 *   HORÁRIO CONFIRMADO pelo Marco (10/06): Seg a Sex 08:00–17:00,
 *   Sáb 09:00–12:00. Fecha em feriados, mas atende em emendas/pontes.
 * - Unidade 2 (Araras): "Rua Treze de Maio, 716 / Centro. Araras/SP"
 *   (só existe no site velho — não estava no storefront novo)
 * - Unidade 3: "Rua Edu Chaves 250 sl11 / Vila Basto. Santo André/SP"
 *   ("Vila Basto" sic no site velho; bairro real é Vila Bastos) —
 *   "Loja On-line Sem atendimento" (sem atendimento presencial)
 *
 * WhatsApp das 3 unidades no site velho: (11) 95205-0000 / (11) 4119-0201.
 */
const UNIDADES = [
  {
    id: "unidade-matriz",
    nome: "Unidade 1 — Matriz · Santo André",
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
  {
    id: "unidade-araras",
    nome: "Unidade 2 — Araras",
    rua: "Rua Treze de Maio, 716",
    bairroCidade: "Centro · Araras/SP",
    telefones: ["(11) 2989-6895", "(11) 3565-1880", "(11) 4119-0201"],
    horario: ["Segunda a Sexta: 09:00–18:00", "Sábado: 08:00–12:00"],
    mapsQuery: "Rua Treze de Maio, 716 - Centro, Araras - SP",
    schema: {
      streetAddress: "Rua Treze de Maio, 716 - Centro",
      addressLocality: "Araras",
      openingHours: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "09:00",
          closes: "18:00",
        },
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: "Saturday",
          opens: "08:00",
          closes: "12:00",
        },
      ],
    },
  },
  {
    id: "unidade-vila-bastos",
    nome: "Unidade 3 — Vila Bastos · Santo André",
    rua: "Rua Edu Chaves, 250 — sala 11",
    bairroCidade: "Vila Bastos · Santo André/SP",
    telefones: ["(11) 2989-6895", "(11) 3565-1880"],
    // texto do site velho: "Loja On-line Sem atendimento"
    horario: ["Loja on-line — sem atendimento presencial"],
    mapsQuery: "Rua Edu Chaves, 250 - Vila Bastos, Santo André - SP",
    schema: {
      streetAddress: "Rua Edu Chaves, 250, sala 11 - Vila Bastos",
      addressLocality: "Santo André",
      // sem openingHours: unidade on-line, sem atendimento presencial
      openingHours: undefined,
    },
  },
] as const

/**
 * JSON-LD LocalBusiness por unidade. O layout raiz já injeta o
 * #localbusiness global (matriz) — aqui cada unidade ganha @id próprio
 * (#unidade-*) ligado à Organization, detalhando a rede de lojas pro
 * Google/IAs (SEO local / GEO).
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
        desde 2006. Atendemos de verdade — por WhatsApp, telefone, e-mail ou em
        uma das nossas unidades.
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

      {/* Unidades */}
      <h2 className="mt-10 text-lg font-semibold text-ui-fg-base mb-3">
        Nossas unidades
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
