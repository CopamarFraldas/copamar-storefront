import { Metadata } from "next"

// RASCUNHO em revisão (Marco + pai) → noindex EXPLÍCITO até a aprovação
// (gotcha: robots de página SOBRESCREVE o do layout — aqui é proposital).
// Quando aprovarem: remover o robots + o banner, e o FAQPage schema passa a
// valer pro SEO/GEO.
export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const { getSiteUrl } = await import("@lib/util/seo")
  return {
    title: "Perguntas Frequentes — Fralda Geriátrica e Atacado",
    description:
      "Dúvidas sobre fralda geriátrica: tamanhos, entrega para todo o Brasil, formas de pagamento (PIX, cartão 3x, boleto), atacado para revenda, trocas e devoluções.",
    alternates: { canonical: `${getSiteUrl()}/${countryCode}/perguntas-frequentes` },
    robots: { index: false, follow: false }, // RASCUNHO — tirar na aprovação
  }
}

/**
 * FAQ dedicado (#54) + FAQPage JSON-LD. As 5 primeiras perguntas são as MESMAS
 * já públicas na home (home-faq) — conteúdo já validado; as demais são RASCUNHO
 * pro Marco/pai revisarem (mesmo fluxo do /trocas-e-devolucoes).
 */
const FAQS: { q: string; a: string; rascunho?: boolean }[] = [
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
  // ── abaixo: RASCUNHO (revisar com o Marco/pai antes de publicar) ──
  {
    q: "Vocês são fabricantes de fralda?",
    a: "Somos distribuidora e atacadista especializada: compramos direto das fábricas das principais marcas (Bigfral, Tena, Adultcare e outras) e repassamos o preço de atacado. Por isso conseguimos preço de fábrica sem abrir mão da variedade de marcas.",
    rascunho: true,
  },
  {
    q: "Qual a diferença entre fralda geriátrica e roupa íntima (pants)?",
    a: "A fralda tradicional tem abas adesivas e é indicada pra quem tem mobilidade reduzida ou está acamado. A roupa íntima descartável (pants) veste como uma calcinha/cueca e é ideal pra quem ainda tem autonomia. Em dúvida, fale com a gente no WhatsApp.",
    rascunho: true,
  },
  {
    q: "Como funcionam as trocas e devoluções?",
    a: "Você pode desistir da compra em até 7 dias após o recebimento (CDC), com o pacote lacrado e intacto — produto de higiene aberto não pode ser revendido. Defeito de fábrica tem troca mesmo com o pacote aberto. Veja a política completa em Trocas e Devoluções.",
    rascunho: true,
  },
  {
    q: "Quanto tempo demora a entrega?",
    a: "Depende do CEP: na Grande São Paulo costuma ser mais rápido (entrega própria); para o restante do Brasil o prazo da transportadora aparece no checkout antes de você fechar o pedido.",
    rascunho: true,
  },
  {
    q: "Vocês emitem nota fiscal?",
    a: "Sim, toda compra sai com nota fiscal (CPF ou CNPJ, à sua escolha na finalização da compra).",
    rascunho: true,
  },
]

function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "pt-BR",
    // speakable (GEO/voz): o que assistentes podem ler em voz alta
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["[data-faq-item]"],
    },
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
}

export default function PerguntasFrequentesPage() {
  return (
    <div className="content-container max-w-3xl py-10 small:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema()) }}
      />

      {/* banner de rascunho — remover quando o Marco e o pai aprovarem */}
      <div className="mb-6 rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-200">
        📝 <strong>RASCUNHO em revisão</strong> — as perguntas marcadas abaixo
        ainda serão validadas pela Copamar antes de valer oficialmente.
      </div>

      <h1 className="text-3xl font-bold text-ui-fg-base mb-2">
        Perguntas frequentes
      </h1>
      <p className="text-ui-fg-subtle mb-8">
        As dúvidas que mais escutamos em quase 20 anos vendendo fralda
        geriátrica no atacado. Não achou a sua? Chama no WhatsApp.
      </p>

      <div className="flex flex-col gap-y-3">
        {FAQS.map((f) => (
          <details
            key={f.q}
            data-faq-item
            className="group rounded-xl border border-ui-border-base bg-ui-bg-base px-5 py-4"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ui-fg-base">
              <span>
                {f.q}
                {f.rascunho && (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    rascunho
                  </span>
                )}
              </span>
              <span className="text-ui-fg-subtle transition-transform group-open:rotate-180">
                ⌄
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ui-fg-subtle">{f.a}</p>
          </details>
        ))}
      </div>

      <p className="mt-8 text-sm text-ui-fg-subtle">
        Ainda com dúvida?{" "}
        <a
          href="https://wa.me/5511952050000"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-copamar-primary underline"
        >
          Fale com a gente no WhatsApp
        </a>{" "}
        — Seg a Sex, 08h às 17h.
      </p>
    </div>
  )
}
