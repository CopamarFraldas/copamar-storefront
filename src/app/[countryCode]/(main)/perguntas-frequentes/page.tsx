import { Metadata } from "next"

// PUBLICADA — aprovada pelo Marco em 10/06. robots = robotsMeta() segue o env
// (noindex em staging, index em produção); o FAQPage schema agora vale p/ SEO/GEO.
export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const { getSiteUrl, robotsMeta } = await import("@lib/util/seo")
  return {
    title: "Perguntas Frequentes — Fralda Geriátrica e Atacado",
    description:
      "Dúvidas sobre fralda geriátrica: tamanhos, entrega para todo o Brasil, formas de pagamento (PIX, cartão 3x, boleto), atacado para revenda, trocas e devoluções.",
    alternates: { canonical: `${getSiteUrl()}/${countryCode}/perguntas-frequentes` },
    robots: robotsMeta(),
  }
}

/**
 * FAQ dedicado (#54) + FAQPage JSON-LD. PUBLICADO 10/06 (Marco aprovou todas as
 * perguntas). As 5 primeiras espelham a home (home-faq); as demais foram
 * validadas junto com as políticas. Todas entram no FAQPage schema.
 */
const FAQS: { q: string; a: string }[] = [
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
  {
    q: "Vocês são fabricantes de fralda?",
    a: "Somos distribuidora e atacadista especializada: compramos direto das fábricas das principais marcas (Bigfral, Tena, Adultcare e outras) e repassamos o preço de atacado. Por isso conseguimos preço de fábrica sem abrir mão da variedade de marcas.",
  },
  {
    q: "Qual a diferença entre fralda geriátrica e roupa íntima (pants)?",
    a: "A fralda tradicional tem abas adesivas e é indicada pra quem tem mobilidade reduzida ou está acamado. A roupa íntima descartável (pants) veste como uma calcinha/cueca e é ideal pra quem ainda tem autonomia. Em dúvida, fale com a gente no WhatsApp.",
  },
  {
    q: "Como funcionam as trocas e devoluções?",
    a: "Você pode desistir da compra em até 7 dias após o recebimento (CDC), com o pacote lacrado e intacto — produto de higiene aberto não pode ser revendido. Defeito de fábrica tem troca mesmo com o pacote aberto. Veja a política completa em Trocas e Devoluções.",
  },
  {
    q: "Quanto tempo demora a entrega?",
    a: "Depende do CEP: na Grande São Paulo costuma ser mais rápido (entrega própria); para o restante do Brasil o prazo da transportadora aparece no checkout antes de você fechar o pedido.",
  },
  {
    q: "Vocês emitem nota fiscal?",
    a: "Sim, toda compra sai com nota fiscal (CPF ou CNPJ, à sua escolha na finalização da compra).",
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
              <span>{f.q}</span>
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
