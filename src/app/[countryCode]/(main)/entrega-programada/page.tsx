import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getEntregaProgramadaConfig } from "@lib/data/entrega-programada"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Landing da Entrega Programada (padrão /cashback) — marketing, INDEXÁVEL
 * (robots normal via robotsMeta(), como as outras páginas públicas).
 *
 * Kill-switch: enquanto a flag copamar_kv 'entrega_programada' estiver OFF
 * (o programa nasce desligado), a página devolve 404 — nunca prometer 5% antes
 * do Marco ligar. Ligou no admin → a página aparece sozinha, sem deploy.
 *
 * REGRAS exibidas = as aprovadas pelo Marco 10/07 (imutáveis nesta build):
 * 5% em TODA entrega em QUALQUER pagamento (substitui o PIX5, nunca soma; não
 * acumula com cupom manual nem resgate de cashback); SEM cobrança automática
 * (nenhum cartão guardado); não pagou → pula o ciclo, sem multa. O texto fala
 * com o público 45-65: frases curtas, sem juridiquês, letra confortável.
 */

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const { getSiteUrl, robotsMeta } = await import("@lib/util/seo")
  return {
    title: "Entrega Programada Copamar — 5% de desconto em toda entrega",
    description:
      "Receba suas fraldas geriátricas automaticamente, no seu ritmo, com 5% de desconto em toda entrega — em qualquer forma de pagamento. Sem cartão guardado, sem fidelidade: pule, pause ou cancele quando quiser.",
    alternates: {
      canonical: `${getSiteUrl()}/${countryCode}/entrega-programada`,
    },
    robots: robotsMeta(),
  }
}

const FAQS: { q: string; a: string }[] = [
  {
    q: "Vocês guardam o meu cartão?",
    a: "Não. Nunca. Não existe cobrança automática: a cada entrega, você recebe um WhatsApp com o pedido pronto e o desconto aplicado — e só paga se quiser, por PIX, cartão ou boleto.",
  },
  {
    q: "E se eu não precisar da entrega desse ciclo?",
    a: "É só não pagar — a entrega pula sozinha para o próximo ciclo, sem cobrança e sem multa. Se preferir, dá para pular com um toque na sua conta, antes mesmo do aviso chegar.",
  },
  {
    q: "Tem fidelidade ou multa para cancelar?",
    a: "Não tem. Pausar ou cancelar é um toque na sua conta (ou uma mensagem no WhatsApp), a qualquer momento. Cancelou e mudou de ideia? É só programar de novo no próximo pedido.",
  },
  {
    q: "O desconto de 5% vale em qual pagamento?",
    a: "Em todos: PIX, cartão de crédito e boleto. O desconto da Entrega Programada substitui o desconto do PIX à vista (eles não somam) e não acumula com cupom nem com resgate de cashback.",
  },
  {
    q: "O preço é o mesmo do meu primeiro pedido?",
    a: "Cada entrega usa o preço vigente do dia, com os 5% de desconto por cima. Se algum item estiver em falta, ele fica de fora daquela entrega — você vê tudo antes de pagar.",
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
    titulo: "1. Você compra uma vez",
    texto:
      "Depois de fechar um pedido, escolha receber de novo a cada 2, 3, 4 ou 6 semanas. Um toque e pronto — sem cadastro extra, sem cartão guardado.",
  },
  {
    emoji: "📲",
    titulo: "2. A gente prepara e avisa",
    texto:
      "Quando chega a data, montamos o seu pedido com os preços do dia e os 5% de desconto já aplicados, e mandamos um WhatsApp com o link. Nada é cobrado sozinho.",
  },
  {
    emoji: "💳",
    titulo: "3. Você confirma e paga",
    texto:
      "Abriu o link, conferiu, pagou — PIX, cartão ou boleto, sempre com 5% de desconto. Não precisa dessa entrega? É só não pagar: ela pula para o próximo ciclo, sem multa.",
  },
  {
    emoji: "🔓",
    titulo: "4. Você manda",
    texto:
      "Pular a próxima, pausar ou cancelar é um toque na sua conta (ou pelo WhatsApp), a qualquer momento. Sem fidelidade, sem letra miúda.",
  },
]

export default async function EntregaProgramadaPage() {
  const config = await getEntregaProgramadaConfig()
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
          📦
        </span>
        <h1 className="mt-3 text-3xl small:text-4xl font-bold text-ui-fg-base">
          Entrega Programada Copamar
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-ui-fg-subtle">
          Fralda é compra que se repete — então deixa com a gente. Receba no
          seu ritmo, com <strong>5% de desconto em TODA entrega, em qualquer
          forma de pagamento</strong>. Sem cartão guardado, sem fidelidade, sem
          pegadinha.
        </p>
        <div className="mt-6 flex flex-col small:flex-row items-center justify-center gap-3">
          <LocalizedClientLink
            href="/store"
            className="inline-flex items-center justify-center rounded-rounded bg-copamar-cta hover:bg-copamar-cta-dark px-6 py-3 text-base font-bold text-[#0a2e6b] transition-colors"
            data-testid="ep-comecar"
          >
            Fazer meu pedido
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/account"
            className="inline-flex items-center justify-center rounded-rounded border border-ui-border-base px-6 py-3 text-base font-semibold text-copamar-primary hover:bg-ui-bg-subtle transition-colors"
          >
            Ver minhas entregas
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
          <strong>5% de desconto em toda entrega</strong>, em qualquer forma de
          pagamento — PIX, cartão ou boleto.
        </li>
        <li>
          O 5% da Entrega Programada <strong>substitui</strong> o desconto do
          PIX à vista (não soma) e não acumula com cupom nem com resgate de
          cashback.
        </li>
        <li>
          <strong>Nenhuma cobrança automática</strong>: a gente nunca guarda o
          seu cartão. Cada entrega só acontece quando VOCÊ paga.
        </li>
        <li>
          Não pagou? A gente manda um lembrete — e, se não rolar, a entrega{" "}
          <strong>pula para o próximo ciclo</strong>, sem multa e sem cobrança.
        </li>
        <li>
          Os preços de cada entrega são os vigentes no dia; item em falta fica
          de fora daquela entrega (você confere tudo antes de pagar).
        </li>
        <li>
          Pular, pausar ou cancelar quando quiser, na sua conta ou pelo
          WhatsApp — <strong>sem fidelidade e sem multa</strong>.
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
          Faça um pedido e programe a próxima entrega em um toque — o 5% é seu
          em todas.
        </p>
        <LocalizedClientLink
          href="/store"
          className="mt-4 inline-flex items-center justify-center rounded-rounded bg-copamar-cta hover:bg-copamar-cta-dark px-6 py-3 text-base font-bold text-[#0a2e6b] transition-colors"
        >
          Fazer meu pedido
        </LocalizedClientLink>
      </div>
    </div>
  )
}
