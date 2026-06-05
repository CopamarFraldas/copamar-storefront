import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a Copamar Fraldas: WhatsApp (11) 95205-0000, e-mail vendas@copamarfraldas.com.br. Rua Iugoslávia, 167 — Parque das Nações, Santo André/SP. Seg a Sex, 08h às 17h.",
}

const WHATS_ATENDENTE = "https://wa.me/5511952050000"
const WHATS_MAPA = "https://wa.me/551149903013"
const EMAIL = "vendas@copamarfraldas.com.br"
const MAPS =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("Rua Iugoslávia, 167 - Parque das Nações, Santo André - SP")

/**
 * Página de CONTATO (Marco 04/06 — link existia no pós-compra mas a página não).
 * Dados oficiais = os mesmos da página /sobre e do rodapé. Mobile-first, direto.
 */
export default function ContatoPage() {
  return (
    <div className="content-container max-w-3xl py-10 small:py-16">
      <h1 className="text-3xl font-bold text-ui-fg-base mb-2">Fale com a gente</h1>
      <p className="text-ui-fg-subtle mb-8">
        Empresa familiar de Santo André/SP, especialista em fraldas geriátricas
        desde 2006. Atendemos de verdade — por WhatsApp, e-mail ou na loja.
      </p>

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

        {/* endereço */}
        <a
          href={MAPS}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-ui-border-base p-5 transition hover:border-copamar-primary hover:shadow-md"
        >
          <p className="text-sm font-semibold text-ui-fg-base">📍 Loja e retirada</p>
          <p className="mt-1 text-base font-semibold text-ui-fg-base leading-snug">
            Rua Iugoslávia, 167 — Parque das Nações
            <br />
            Santo André/SP
          </p>
          <p className="mt-1 text-xs text-ui-fg-subtle">Seg a Sex · 08h às 17h · ver no mapa →</p>
        </a>
      </div>

      <p className="mt-8 text-xs text-ui-fg-subtle">
        Copamar Fraldas · CNPJ 08.140.992/0001-64 · Há quase 20 anos cuidando de
        quem você ama.
      </p>
    </div>
  )
}
