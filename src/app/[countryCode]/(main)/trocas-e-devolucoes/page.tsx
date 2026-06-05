import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// RASCUNHO em revisão (Marco + pai) → noindex EXPLÍCITO nesta página, mesmo
// após o go-live do site (gotcha: robots de página SOBRESCREVE o do layout —
// aqui é proposital). Quando aprovarem, remover o robots + o banner.
export const metadata: Metadata = {
  title: "Trocas e Devoluções",
  description:
    "Política de trocas e devoluções da Copamar Fraldas: arrependimento em até 7 dias (CDC) e troca por defeito de fábrica.",
  robots: { index: false, follow: false },
}

/**
 * Política de Trocas e Devoluções — RASCUNHO (Marco 04/06).
 * Base: CDC art. 49 (arrependimento, 7 dias) + art. 18 (vício/defeito) +
 * regra sanitária da loja: produto de higiene pessoal só volta LACRADO.
 * Regra explícita pedida pelo Marco: pacote aberto/avariado NÃO troca por
 * desistência — só quando houver defeito de fábrica.
 */
export default function TrocasDevolucoesPage() {
  return (
    <div className="content-container max-w-3xl py-10 small:py-16">
      {/* banner de rascunho — remover quando o Marco e o pai aprovarem */}
      <div className="mb-6 rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-200">
        📝 <strong>RASCUNHO em revisão</strong> — este texto ainda será validado
        pela Copamar antes de valer oficialmente.
      </div>

      <h1 className="text-3xl font-bold text-ui-fg-base mb-2">
        Trocas e Devoluções
      </h1>
      <p className="text-ui-fg-subtle mb-8">
        Comprou e mudou de ideia, errou o tamanho ou veio com problema? A gente
        resolve — do jeito mais simples possível.
      </p>

      <div className="flex flex-col gap-y-8 text-ui-fg-base">
        <section>
          <h2 className="text-xl font-semibold mb-2">
            1. Desistência da compra (até 7 dias)
          </h2>
          <p className="text-sm leading-relaxed text-ui-fg-subtle">
            Comprando pelo site, você pode desistir em até{" "}
            <strong className="text-ui-fg-base">
              7 dias corridos após o recebimento
            </strong>{" "}
            (art. 49 do Código de Defesa do Consumidor), com devolução integral
            do valor pago, incluindo o frete.
          </p>
          {/* regra do pacote — explícita, pedido do Marco */}
          <div className="mt-3 rounded-lg border border-copamar-primary/30 bg-copamar-primary/5 px-4 py-3 text-sm leading-relaxed">
            ⚠️ <strong>Importante — embalagem lacrada:</strong> fraldas,
            absorventes e demais produtos de higiene pessoal só podem ser
            devolvidos por desistência com o{" "}
            <strong>
              pacote intacto: lacrado, sem violação e sem avarias
            </strong>
            . Por norma sanitária, produto de higiene com embalagem aberta não
            pode ser recolocado à venda — por isso,{" "}
            <strong>
              pacote aberto não é aceito em troca por desistência
            </strong>
            . (Se o produto veio com defeito, é outra história — veja o item 2:
            aí a troca vale mesmo com o pacote aberto.)
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            2. Defeito de fábrica
          </h2>
          <p className="text-sm leading-relaxed text-ui-fg-subtle">
            Se o produto apresentar defeito de fabricação (ex.: fita adesiva que
            não cola, gel exposto, pacote com unidades danificadas), você tem{" "}
            <strong className="text-ui-fg-base">30 dias</strong> a partir do
            recebimento pra reclamar (art. 26 do CDC). Nesse caso a troca vale{" "}
            <strong className="text-ui-fg-base">
              mesmo com o pacote aberto
            </strong>{" "}
            — afinal, foi abrindo que você descobriu o problema. A gente troca o
            produto, abate do valor ou devolve o dinheiro: você escolhe (art. 18
            do CDC). O frete da devolução por defeito é por nossa conta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Errou o tamanho?</h2>
          <p className="text-sm leading-relaxed text-ui-fg-subtle">
            Acontece! Com o <strong className="text-ui-fg-base">pacote lacrado</strong>,
            trocamos pelo tamanho certo em até 7 dias do recebimento. Fale com a
            gente no WhatsApp que combinamos a logística. Na dúvida antes de
            comprar, use o nosso{" "}
            <LocalizedClientLink href="/" className="text-copamar-primary underline">
              guia de tamanhos
            </LocalizedClientLink>{" "}
            ou pergunte no WhatsApp — ajudamos a acertar de primeira.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Como solicitar</h2>
          <ol className="list-decimal pl-5 text-sm leading-relaxed text-ui-fg-subtle flex flex-col gap-y-1">
            <li>
              Chame a gente no{" "}
              <a
                href="https://wa.me/5511952050000"
                target="_blank"
                rel="noopener noreferrer"
                className="text-copamar-primary underline"
              >
                WhatsApp (11) 95205-0000
              </a>{" "}
              (Seg a Sex, 08h–17h) ou por e-mail{" "}
              <a
                href="mailto:vendas@copamarfraldas.com.br"
                className="text-copamar-primary underline"
              >
                vendas@copamarfraldas.com.br
              </a>
              , informando o <strong>número do pedido</strong>.
            </li>
            <li>No caso de defeito, mande fotos do produto e da embalagem.</li>
            <li>
              A gente confirma e combina a coleta/envio. Reembolsos saem pelo
              mesmo meio de pagamento da compra (PIX, cartão ou boleto/conta).
            </li>
          </ol>
        </section>

        <p className="text-xs text-ui-fg-subtle border-t border-ui-border-base pt-4">
          Copamar Fraldas · CNPJ 08.140.992/0001-64 · Rua Iugoslávia, 167 —
          Parque das Nações, Santo André/SP. Esta política complementa o Código
          de Defesa do Consumidor (Lei 8.078/90), que prevalece em caso de
          divergência.
        </p>
      </div>
    </div>
  )
}
