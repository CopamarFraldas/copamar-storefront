import { Faq } from "@lib/data/blog"
import { faqPageSchema, JsonLd } from "@modules/common/components/structured-data"

const ArticleFaq = ({ faqs }: { faqs?: Faq[] }) => {
  if (!faqs || faqs.length === 0) {
    return null
  }

  return (
    <section className="max-w-2xl mt-12" aria-labelledby="faq-titulo">
      {/* FAQPage Schema pra rich results / GEO */}
      <JsonLd data={faqPageSchema(faqs)} />
      <h2 id="faq-titulo" className="text-xl font-semibold text-ui-fg-base mb-4">
        Perguntas frequentes
      </h2>
      <div className="flex flex-col divide-y divide-ui-border-base border-y border-ui-border-base">
        {faqs.map((f, i) => (
          <details key={i} className="py-4 group">
            <summary className="cursor-pointer list-none flex justify-between items-center gap-4 text-base-semi text-ui-fg-base">
              <span>{f.pergunta}</span>
              <span className="text-ui-fg-subtle transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="text-base-regular text-ui-fg-subtle leading-7 mt-3">
              {f.resposta}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}

export default ArticleFaq
