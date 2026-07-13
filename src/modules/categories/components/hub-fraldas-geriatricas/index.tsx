import {
  JsonLd,
  faqPageSchema,
  type FaqItem,
} from "@modules/common/components/structured-data"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import GuiaMedidas from "@modules/products/components/guia-medidas"

/**
 * HUB da categoria "fraldas geriátricas" (termo-cabeça do Search Console):
 * guia "Como escolher" enxuto + bloco fábrica/atacado + FAQ com FAQPage
 * JSON-LD. Renderiza SÓ nesta categoria (guard por handle na page).
 * Conteúdo 100% factual — fatos batem com /sobre, home-faq e guia-medidas;
 * zero health claim (regra da casa).
 */

// Respostas curtas e factuais — mesmas fontes do resto do site (tabela geral
// do guia de medidas, FAQ da home/perguntas-frequentes, escala #87 de gotas).
const FAQS: FaqItem[] = [
  {
    pergunta: "Qual tamanho de fralda geriátrica para quem pesa 120 kg?",
    resposta:
      "O tamanho vai pela medida da cintura ou do quadril, não pelo peso. Na tabela geral, o G atende de 90 a 150 cm e o EG de 110 a 165 cm (aproximado — varia por marca). Meça com uma fita métrica e confira a faixa exata na descrição do produto.",
  },
  {
    pergunta:
      "Qual a diferença entre fralda geriátrica e roupa íntima descartável (pants)?",
    resposta:
      "A fralda aberta fecha com fitas adesivas e facilita a troca de quem passa mais tempo deitado ou precisa de ajuda. A roupa íntima (pants) veste como uma calcinha ou cueca, prática para quem caminha e troca sozinho ou com pouca ajuda.",
  },
  {
    pergunta: "O que significam as gotas de absorção?",
    resposta:
      "Cada produto traz um nível de absorção de 1 a 5 gotas: quanto mais gotas, maior a capacidade. Os modelos noturnos, indicados pelo fabricante para períodos longos sem troca, aparecem marcados com o símbolo de lua.",
  },
  {
    pergunta: "Comprar no atacado tem desconto?",
    resposta:
      "Sim. O fardo fechado tem o melhor preço por unidade, e pagando à vista (PIX ou boleto) o desconto é de 5%. Farmácias, clínicas e casas de repouso têm condições de atacado — fale com nosso time pelo WhatsApp.",
  },
  {
    pergunta: "Quanto tempo demora a entrega?",
    resposta:
      "Depende do CEP: na Grande São Paulo costuma ser mais rápido (entrega própria); para o restante do Brasil, o prazo da transportadora aparece no checkout antes de você fechar o pedido.",
  },
]

const WPP = "https://wa.me/5511952050000"

export default function HubFraldasGeriatricas() {
  return (
    <section
      aria-label="Guia e perguntas frequentes sobre fralda geriátrica"
      className="content-container flex flex-col gap-y-12 pb-16 pt-4"
    >
      <JsonLd data={faqPageSchema(FAQS, "[data-faq-hub]")} />

      {/* Como escolher — 3 critérios factuais, enxutos */}
      <div>
        <h2 className="mb-6 text-xl font-semibold text-ui-fg-base small:text-2xl">
          Como escolher a fralda geriátrica
        </h2>
        <div className="grid grid-cols-1 gap-4 small:grid-cols-3">
          <div className="flex flex-col gap-y-2 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-5">
            <h3 className="text-base font-semibold text-ui-fg-base">
              1. Tamanho: cintura ou quadril
            </h3>
            <p className="text-sm leading-relaxed text-ui-fg-subtle">
              O tamanho vai pela medida da{" "}
              <strong className="text-ui-fg-base">cintura ou do quadril</strong>
              , não pelo peso. Faixas gerais: P 56–85 cm · M 70–115 cm · G
              90–150 cm · EG 110–165 cm (aproximado, varia por marca).
            </p>
            <GuiaMedidas />
          </div>
          <div className="flex flex-col gap-y-2 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-5">
            <h3 className="text-base font-semibold text-ui-fg-base">
              2. Absorção: escala de gotas
            </h3>
            <p className="text-sm leading-relaxed text-ui-fg-subtle">
              Cada produto mostra o nível de absorção de{" "}
              <strong className="text-ui-fg-base">1 a 5 gotas</strong> — quanto
              mais gotas, maior a capacidade. Os modelos noturnos, para
              períodos longos sem troca, levam o símbolo 🌙.
            </p>
          </div>
          <div className="flex flex-col gap-y-2 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-5">
            <h3 className="text-base font-semibold text-ui-fg-base">
              3. Aberta ou de vestir
            </h3>
            <p className="text-sm leading-relaxed text-ui-fg-subtle">
              A <strong className="text-ui-fg-base">fralda aberta</strong>{" "}
              fecha com fitas e facilita a troca de quem fica deitado. A de
              vestir sobe como roupa íntima, para quem caminha — veja a linha
              de{" "}
              <LocalizedClientLink
                href="/categories/roupa-intima"
                className="font-medium text-copamar-primary underline underline-offset-2"
              >
                Roupa Íntima (Pants)
              </LocalizedClientLink>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Direto da fábrica / atacado — o diferencial que já rankeia */}
      <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-6 small:p-8">
        <h2 className="mb-3 text-xl font-semibold text-ui-fg-base small:text-2xl">
          Direto da fábrica, no atacado e no varejo
        </h2>
        <p className="mb-3 max-w-3xl text-base leading-relaxed text-ui-fg-subtle">
          Somos distribuidora e atacadista especializada: compramos direto das
          fábricas das principais marcas e repassamos o preço de atacado — no
          fardo fechado, o melhor preço por unidade. Também vendemos pacotes
          avulsos no varejo, para testar o modelo antes de fechar o fardo.
        </p>
        <p className="mb-6 max-w-3xl text-base leading-relaxed text-ui-fg-subtle">
          Começamos no Tucuruvi, em 2006; hoje a loja física e o centro de
          distribuição ficam em Santo André/SP, com entrega própria na Grande
          São Paulo e envio para todo o Brasil.
        </p>
        <LocalizedClientLink
          href="/store"
          className="inline-flex min-h-[44px] items-center rounded-full bg-copamar-primary px-6 py-2 text-base font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-copamar-primary focus-visible:ring-offset-2"
        >
          Ver o catálogo completo
        </LocalizedClientLink>
      </div>

      {/* FAQ — mesmas perguntas do JSON-LD acima (details/summary, zero JS) */}
      <div>
        <h2 className="mb-6 text-xl font-semibold text-ui-fg-base small:text-2xl">
          Perguntas frequentes sobre fralda geriátrica
        </h2>
        <div className="max-w-3xl divide-y divide-ui-border-base">
          {FAQS.map((f) => (
            <details key={f.pergunta} data-faq-hub className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-x-4 text-base font-medium text-ui-fg-base">
                {f.pergunta}
                <span
                  aria-hidden
                  className="text-xl leading-none text-ui-fg-subtle transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ui-fg-subtle">
                {f.resposta.includes("WhatsApp") ? (
                  <>
                    {f.resposta.split("WhatsApp")[0]}
                    <a
                      href={WPP}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-copamar-primary underline underline-offset-2"
                    >
                      WhatsApp
                    </a>
                    {f.resposta.split("WhatsApp")[1]}
                  </>
                ) : (
                  f.resposta
                )}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
