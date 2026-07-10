import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCashbackConfig } from "@lib/data/cashback"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Página do programa de Cashback (estilo tena.com.br/cashback) — marketing,
 * INDEXÁVEL (robots normal via robotsMeta(), como as outras páginas públicas).
 *
 * Kill-switch: enquanto CASHBACK_ATIVO estiver OFF (o programa nasce desligado),
 * a página devolve 404 — nunca prometer cashback antes do Marco ligar a flag.
 * Ligou no admin → a página aparece sozinha, sem deploy.
 *
 * REGRAS exibidas = as aprovadas pelo Marco (imutáveis nesta build). O texto
 * fala com o público 45-65: frases curtas, sem juridiquês, letra confortável.
 */

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const { getSiteUrl, robotsMeta } = await import("@lib/util/seo")
  return {
    title: "Cashback Copamar — 1% de volta em toda compra",
    description:
      "Compre fralda geriátrica na Copamar e receba 1% do valor dos produtos de volta para usar na próxima compra. Sem sorteio, sem pegadinha: comprou, ganhou.",
    alternates: { canonical: `${getSiteUrl()}/${countryCode}/cashback` },
    robots: robotsMeta(),
  }
}

const FAQS: { q: string; a: string }[] = [
  {
    q: "Como eu ganho cashback?",
    a: "Comprando, só isso. A cada pedido pago, 1% do valor dos produtos vira saldo na sua conta Copamar. Frete e a parte coberta por cupom de desconto não entram na conta.",
  },
  {
    q: "Quando o saldo fica liberado para usar?",
    a: "15 dias depois que o pedido é enviado. Quando liberar, a gente avisa você pelo WhatsApp. Se o pedido for cancelado ou devolvido antes disso, o crédito é cancelado junto.",
  },
  {
    q: "Como eu uso o meu cashback?",
    a: "Na hora de fechar a próxima compra, aparece um botão para usar o saldo. Um clique e pronto: o cashback cobre até 30% do valor dos produtos da nova compra (o frete não). Ele não soma com cupom de desconto, mas funciona junto com os 5% do PIX.",
  },
  {
    q: "E se meu pedido for cancelado?",
    a: "Se você usou cashback em um pedido que acabou cancelado, a gente devolve todo o saldo usado para a sua conta — com a validade renovada, para você não perder nada por causa do cancelamento.",
  },
  {
    q: "O cashback expira?",
    a: "Sim: cada crédito vale por 60 dias depois de liberado. É só usar dentro desse prazo — a gente lembra você pelo WhatsApp quando ele liberar.",
  },
]

function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "pt-BR",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
}

const PASSOS: { emoji: string; titulo: string; texto: string }[] = [
  {
    emoji: "🛒",
    titulo: "1. Você compra",
    texto:
      "A cada pedido pago, 1% do valor dos produtos vira saldo de cashback na sua conta. Automático — não precisa de código nem cadastro extra.",
  },
  {
    emoji: "📦",
    titulo: "2. O saldo libera",
    texto:
      "15 dias depois que o pedido é enviado, o crédito fica liberado. A gente avisa você pelo WhatsApp assim que estiver pronto para usar.",
  },
  {
    emoji: "💳",
    titulo: "3. Você usa na próxima compra",
    texto:
      "No fechamento da compra, um clique aplica o saldo: ele cobre até 30% do valor dos produtos. E ainda funciona junto com os 5% de desconto do PIX.",
  },
  {
    emoji: "⏰",
    titulo: "4. Vale por 60 dias",
    texto:
      "Depois de liberado, o crédito vale por 60 dias. Como fralda é compra que se repete, dá tempo de sobra de aproveitar.",
  },
]

export default async function CashbackPage() {
  const config = await getCashbackConfig()
  if (!config.ativo) {
    notFound()
  }

  return (
    <div className="content-container max-w-3xl py-10 small:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema()) }}
      />

      {/* hero */}
      <div className="text-center mb-10">
        <span className="text-5xl" aria-hidden>
          💰
        </span>
        <h1 className="mt-3 text-3xl small:text-4xl font-bold text-ui-fg-base">
          Cashback Copamar
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-ui-fg-subtle">
          A cada compra, <strong>1% do valor dos produtos volta para você</strong>{" "}
          em forma de saldo, para usar na próxima compra. Sem sorteio, sem
          pontos complicados: comprou, ganhou.
        </p>
        <div className="mt-6 flex flex-col small:flex-row items-center justify-center gap-3">
          <LocalizedClientLink
            href="/account"
            className="inline-flex items-center justify-center rounded-rounded bg-copamar-cta hover:bg-copamar-cta-dark px-6 py-3 text-base font-bold text-[#0a2e6b] transition-colors"
            data-testid="cashback-ver-saldo"
          >
            Ver meu saldo
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/store"
            className="inline-flex items-center justify-center rounded-rounded border border-ui-border-base px-6 py-3 text-base font-semibold text-copamar-primary hover:bg-ui-bg-subtle transition-colors"
          >
            Começar a comprar
          </LocalizedClientLink>
        </div>
      </div>

      {/* como funciona */}
      <h2 className="text-xl font-bold text-ui-fg-base mb-4">Como funciona</h2>
      <div className="grid grid-cols-1 small:grid-cols-2 gap-4 mb-10">
        {PASSOS.map((p) => (
          <div
            key={p.titulo}
            className="rounded-xl border border-ui-border-base bg-copamar-cream px-5 py-4"
          >
            <div className="text-2xl" aria-hidden>
              {p.emoji}
            </div>
            <h3 className="mt-2 text-base font-semibold text-ui-fg-base">
              {p.titulo}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-ui-fg-subtle">
              {p.texto}
            </p>
          </div>
        ))}
      </div>

      {/* regras rápidas — as combinadas, sem letra miúda escondida */}
      <h2 className="text-xl font-bold text-ui-fg-base mb-4">
        Combinado é combinado
      </h2>
      <ul className="mb-10 flex flex-col gap-y-2 text-base leading-relaxed text-ui-fg-subtle list-disc pl-5">
        <li>
          O cashback é <strong>1% do valor dos produtos pagos</strong> — frete e
          a parte coberta por cupom de desconto não geram cashback.
        </li>
        <li>
          O saldo cobre <strong>até 30% do valor dos produtos</strong> da nova
          compra (nunca o frete e nunca 100% do pedido).
        </li>
        <li>
          Não soma com cupom de desconto — mas{" "}
          <strong>funciona junto com os 5% do PIX</strong>.
        </li>
        <li>
          Pedido cancelado ou devolvido antes da liberação cancela o crédito.
        </li>
        <li>
          Vale para pedidos enviados a partir do início do programa (compras
          antigas não geram saldo retroativo).
        </li>
      </ul>

      {/* FAQ curto */}
      <h2 className="text-xl font-bold text-ui-fg-base mb-4">
        Perguntas rápidas
      </h2>
      <div className="flex flex-col gap-y-3 mb-10">
        {FAQS.map((f) => (
          <details
            key={f.q}
            className="group rounded-xl border border-ui-border-base bg-ui-bg-base px-5 py-4"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-semibold text-ui-fg-base">
              <span>{f.q}</span>
              <span className="text-ui-fg-subtle transition-transform group-open:rotate-180">
                ⌄
              </span>
            </summary>
            <p className="mt-3 text-base leading-relaxed text-ui-fg-subtle">
              {f.a}
            </p>
          </details>
        ))}
      </div>

      {/* CTA final */}
      <div className="rounded-xl bg-copamar-cream-deep px-6 py-8 text-center">
        <p className="text-lg font-semibold text-ui-fg-base">
          Seu saldo fica na sua conta, prontinho para a próxima compra.
        </p>
        <LocalizedClientLink
          href="/account"
          className="mt-4 inline-flex items-center justify-center rounded-rounded bg-copamar-cta hover:bg-copamar-cta-dark px-6 py-3 text-base font-bold text-[#0a2e6b] transition-colors"
        >
          Ver meu saldo
        </LocalizedClientLink>
      </div>
    </div>
  )
}
