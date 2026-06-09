import { JsonLd } from "@modules/common/components/structured-data"

/**
 * FAQ da home (item 8 da proposta) — tira objeção (tamanho, frete, pagamento,
 * atacado) e alimenta GEO/IA via FAQPage JSON-LD. Conteúdo REAL, sem claim
 * médico. Acordeão nativo com <details>/<summary> (acessível, zero JS).
 */
const FAQS = [
  {
    q: "Como sei qual tamanho de fralda geriátrica escolher?",
    a: "Para encontrar o tamanho ideal, use a medida da cintura ou do quadril, não pelo peso. Você encontra a tabela completa na descrição do produto. Se preferir, chame a gente no WhatsApp que escolhemos juntos!",
  },
  {
    q: "Vocês entregam para todo o Brasil?",
    a: "Sim. Calcule o frete digitando seu CEP na finalização da compra. Para a Grande São Paulo, temos opções de entrega expressa.",
  },
  {
    q: "Quais as formas de pagamento?",
    a: "Escolha como pagar com total segurança: Garanta 5% de desconto no PIX ou parcele em até 3x sem juros no cartão. Também aceitamos boleto.",
  },
  {
    q: "Tem preço de atacado para revenda?",
    a: "Sim — atendemos farmácias, clínicas, casas de repouso e cuidadores com preço de atacado. Fale com nosso time pelo WhatsApp para as condições.",
  },
  {
    q: "Posso comprar uma unidade avulsa ou só fardo fechado?",
    a: "As duas opções estão disponíveis. Você pode levar pacotes avulsos para testar o modelo ou garantir o fardo fechado, que oferece o melhor preço por unidade (mais economia).",
  },
]

// Renderiza a resposta linkando a palavra "WhatsApp" (visível). O JSON-LD
// continua usando f.a puro (texto), preservando o FAQPage limpo.
const WPP = "https://wa.me/5511952050000"
function renderResposta(a: string) {
  const partes = a.split("WhatsApp")
  if (partes.length === 1) return a
  return partes.flatMap((parte, i) =>
    i === 0
      ? [parte]
      : [
          <a
            key={i}
            href={WPP}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-copamar-primary underline underline-offset-2"
          >
            WhatsApp
          </a>,
          parte,
        ]
  )
}

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
              {renderResposta(f.a)}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}

export default HomeFaq
