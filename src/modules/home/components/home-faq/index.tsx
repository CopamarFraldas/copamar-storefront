import { JsonLd } from "@modules/common/components/structured-data"

/**
 * FAQ da home (item 8 da proposta) — tira objeção (tamanho, frete, pagamento,
 * atacado) e alimenta GEO/IA via FAQPage JSON-LD. Conteúdo REAL, sem claim
 * médico. Acordeão nativo com <details>/<summary> (acessível, zero JS).
 */
const FAQS = [
  {
    q: "Como sei qual tamanho de fralda geriátrica escolher?",
    a: "O tamanho vai pela medida da cintura/quadril, não pelo peso. Cada produto traz a tabela de medidas na descrição. Na dúvida, chame a gente no WhatsApp que ajudamos a escolher.",
  },
  {
    q: "Vocês entregam para todo o Brasil?",
    a: "Sim. O frete é calculado pelo seu CEP no checkout, com entrega para todo o Brasil. Na Grande São Paulo há opções mais rápidas.",
  },
  {
    q: "Quais as formas de pagamento?",
    a: "Cartão em até 3x sem juros, PIX com 5% de desconto à vista e boleto. O pagamento é processado com segurança.",
  },
  {
    q: "Tem preço de atacado para revenda?",
    a: "Sim — atendemos farmácias, clínicas, casas de repouso e cuidadores com preço de atacado. Fale com nosso time pelo WhatsApp para as condições.",
  },
  {
    q: "Posso comprar uma unidade avulsa ou só fardo fechado?",
    a: "Os dois. Você compra avulso para experimentar ou o fardo fechado, com preço melhor por unidade.",
  },
]

const HomeFaq = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "pt-BR",
    // speakable (GEO/voz): assistentes sabem o que ler em voz alta
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["#faq-h", "[data-faq-item]"],
    },
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }

  return (
    <section
      aria-labelledby="faq-h"
      className="content-container py-12 small:py-16"
    >
      <JsonLd data={schema} />
      <h2
        id="faq-h"
        className="mb-8 text-center text-2xl font-bold text-copamar-primary dark:text-ui-fg-base small:text-3xl"
      >
        Perguntas frequentes
      </h2>
      <div className="mx-auto max-w-2xl divide-y divide-ui-border-base">
        {FAQS.map((f) => (
          <details key={f.q} data-faq-item className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-x-4 text-base font-medium text-ui-fg-base">
              {f.q}
              <span
                aria-hidden
                className="text-xl leading-none text-ui-fg-subtle transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ui-fg-subtle">
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}

export default HomeFaq
