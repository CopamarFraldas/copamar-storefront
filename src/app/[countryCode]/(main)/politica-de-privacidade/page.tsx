import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// PUBLICADA — aprovada pelo Marco em 10/06. robots = robotsMeta() segue o env
// (noindex em staging, index em produção). NÃO usar undefined: vaza indexação.
export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const { getSiteUrl, robotsMeta } = await import("@lib/util/seo")
  return {
    title: "Política de Privacidade",
    description:
      "Como a Copamar Fraldas coleta, usa e protege seus dados pessoais (LGPD): cadastro, pedidos, cookies, compartilhamento com parceiros e seus direitos como titular.",
    alternates: { canonical: `${getSiteUrl()}/${countryCode}/politica-de-privacidade` },
    robots: robotsMeta(),
  }
}

/**
 * Política de Privacidade (Marco 06/06, exigência LGPD) — PUBLICADA 10/06.
 * Reflete o que o site REALMENTE faz: cookies só com consentimento (banner),
 * pagamento via PagBank/PagHiper, NF via Bling, entrega por transportadora.
 */
export default function PoliticaPrivacidadePage() {
  return (
    <div className="content-container max-w-3xl py-10 small:py-16">
      <h1 className="text-3xl font-bold text-ui-fg-base mb-2">
        Política de Privacidade
      </h1>
      <p className="text-ui-fg-subtle mb-8">
        Seus dados são seus. Aqui explicamos, sem juridiquês, o que coletamos,
        pra quê, e como você controla tudo — conforme a Lei Geral de Proteção
        de Dados (LGPD, Lei 13.709/18).
      </p>

      <div className="flex flex-col gap-y-8 text-ui-fg-base">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. O que coletamos</h2>
          <ul className="list-disc pl-5 text-sm leading-relaxed text-ui-fg-subtle flex flex-col gap-y-1">
            <li>
              <strong className="text-ui-fg-base">Cadastro e pedido:</strong>{" "}
              nome, CPF/CNPJ, e-mail, telefone e endereço — o necessário pra
              faturar (nota fiscal), entregar e falar com você sobre o pedido.
            </li>
            <li>
              <strong className="text-ui-fg-base">Pagamento:</strong> os dados
              do cartão são processados direto pelo PagBank (e boleto pelo
              PagHiper) — <strong>não armazenamos número de cartão</strong> nos
              nossos servidores.
            </li>
            <li>
              <strong className="text-ui-fg-base">Navegação (cookies):</strong>{" "}
              só com o seu consentimento no aviso de cookies. Os essenciais
              (carrinho, login, segurança) são sempre necessários; análise e
              marketing só rodam se você aceitar.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. Pra que usamos</h2>
          <p className="text-sm leading-relaxed text-ui-fg-subtle">
            Processar e entregar pedidos, emitir nota fiscal, atender você
            (WhatsApp/e-mail), prevenir fraudes e — se você consentir — melhorar
            o site e enviar ofertas. Nunca vendemos seus dados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            3. Com quem compartilhamos
          </h2>
          <p className="text-sm leading-relaxed text-ui-fg-subtle">
            Só com quem precisa pra sua compra funcionar:{" "}
            <strong className="text-ui-fg-base">processadores de pagamento</strong>{" "}
            (PagBank, PagHiper), <strong className="text-ui-fg-base">transportadoras</strong>{" "}
            (entrega), <strong className="text-ui-fg-base">sistema fiscal</strong>{" "}
            (emissão de NF-e) e provedores de e-mail transacional. Cada um
            recebe apenas o necessário pra sua função.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Cookies</h2>
          <p className="text-sm leading-relaxed text-ui-fg-subtle">
            Você escolhe no aviso de cookies o que aceitar, e pode mudar de
            ideia quando quiser limpando os cookies do navegador (o aviso
            reaparece). Nenhum rastreador de análise ou marketing roda antes do
            seu consentimento.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            5. Seus direitos (LGPD)
          </h2>
          <p className="text-sm leading-relaxed text-ui-fg-subtle">
            Você pode pedir a qualquer momento: confirmação de tratamento,
            acesso aos seus dados, correção, anonimização ou exclusão,
            portabilidade e revogação de consentimento. É só falar com a gente
            — respondemos em até 15 dias.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">6. Guarda e segurança</h2>
          <p className="text-sm leading-relaxed text-ui-fg-subtle">
            Mantemos os dados do pedido pelo prazo fiscal/legal (notas fiscais
            exigem 5 anos) e protegemos tudo com criptografia em trânsito
            (HTTPS) e acesso restrito. Dados que não precisamos mais guardar
            são excluídos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">7. Fale com a gente</h2>
          <p className="text-sm leading-relaxed text-ui-fg-subtle">
            Dúvidas sobre privacidade ou exercício de direitos:{" "}
            <a
              href="mailto:vendas@copamarfraldas.com.br"
              className="text-copamar-primary underline"
            >
              vendas@copamarfraldas.com.br
            </a>{" "}
            ou pelo{" "}
            <LocalizedClientLink href="/contato" className="text-copamar-primary underline">
              nosso contato
            </LocalizedClientLink>
            .
          </p>
        </section>

        <p className="text-xs text-ui-fg-subtle border-t border-ui-border-base pt-4">
          Copamar Fraldas · CNPJ 08.140.992/0001-64 · Rua Iugoslávia, 167 —
          Parque das Nações, Santo André/SP. Esta política complementa a LGPD
          (Lei 13.709/18) e o Marco Civil da Internet (Lei 12.965/14), que
          prevalecem em caso de divergência.
        </p>
      </div>
    </div>
  )
}
