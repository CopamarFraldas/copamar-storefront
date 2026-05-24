import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  aboutPageSchema,
  localBusinessSchema,
  breadcrumbSchema,
  JsonLd,
} from "@modules/common/components/structured-data"

const SITE_URL = "https://copamarfraldas.com.br"

export const metadata: Metadata = {
  title: "Quem somos — 20 anos de especialização em fraldas geriátricas",
  description:
    "A história da Copamar Fraldas: empresa familiar de Santo André/SP fundada em 2006, especializada em fraldas geriátricas e produtos de higiene para idosos há 20 anos.",
  alternates: { canonical: `${SITE_URL}/sobre` },
}

export default function SobrePage() {
  return (
    <div className="content-container py-12">
      <JsonLd
        data={[
          aboutPageSchema(),
          localBusinessSchema(),
          breadcrumbSchema([
            { name: "Início", url: SITE_URL },
            { name: "Quem somos", url: `${SITE_URL}/sobre` },
          ]),
        ]}
      />

      <article className="max-w-2xl mx-auto flex flex-col gap-y-6 text-ui-fg-subtle">
        <h1 className="text-3xl font-semibold text-ui-fg-base">Quem somos</h1>

        <p className="text-base-regular leading-7">
          A Copamar Fraldas nasceu em 16 de maio de 2006, em Santo André/SP,
          fundada pelos irmãos Marco e Paulo Berco Nascimento. Há 20 anos, nossa
          missão é a mesma: cuidar de quem cuida.
        </p>

        <h2 className="text-xl font-semibold text-ui-fg-base mt-4">
          Uma história de família, para famílias
        </h2>
        <p className="text-base-regular leading-7">
          Começamos pequenos, com uma loja física no Parque das Nações,
          especializada em fraldas geriátricas e produtos de higiene para
          idosos. Naquele tempo, o cuidador familiar — aquele filho ou filha que
          está cuidando do pai ou da mãe — era invisível pro mercado. Lojas
          vendiam fralda como se vendessem chiclete. A gente decidiu fazer
          diferente.
        </p>

        <h2 className="text-xl font-semibold text-ui-fg-base mt-4">
          Dois irmãos, dois sócios, uma especialização
        </h2>
        <p className="text-base-regular leading-7">
          Marco e Paulo dividem a Copamar até hoje. Cada um cuida de uma parte:
          do atendimento na loja física aos pedidos online, do contato direto
          com cuidadores aos contratos com distribuidoras. Não temos acionistas,
          não temos vendedores que recebem comissão por empurrar produto. Temos
          uma empresa familiar com 20 anos de história.
        </p>

        <h2 className="text-xl font-semibold text-ui-fg-base mt-4">
          O que nos faz diferentes
        </h2>
        <ul className="list-disc pl-6 flex flex-col gap-y-3 text-base-regular leading-7">
          <li>
            <strong className="text-ui-fg-base font-semibold">
              Especialização exclusiva:
            </strong>{" "}
            distribuímos apenas fraldas geriátricas, absorventes para
            incontinência e produtos de higiene para idosos. Não é um
            departamento da loja. É a loja inteira.
          </li>
          <li>
            <strong className="text-ui-fg-base font-semibold">
              Tradição em atacado:
            </strong>{" "}
            trabalhamos com grandes volumes para garantir o preço mais justo.
            Atendemos asilos, casas de repouso, home care e cuidadores
            familiares — todos com o mesmo cuidado.
          </li>
          <li>
            <strong className="text-ui-fg-base font-semibold">
              Atendimento próximo:
            </strong>{" "}
            quando você liga ou manda WhatsApp, fala com gente que entende. Não
            é call center. É a Copamar mesmo.
          </li>
          <li>
            <strong className="text-ui-fg-base font-semibold">
              Condições reais:
            </strong>{" "}
            parcelamento em até 6x sem juros e 10% de desconto no PIX ou boleto.
            Sem letra miúda.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-ui-fg-base mt-4">
          Cuidador como bússola
        </h2>
        <p className="text-base-regular leading-7">
          Sabemos que cuidar de uma pessoa querida que envelheceu ou ficou
          doente é uma das experiências mais densas que existem. Cansaço,
          dúvida, culpa, amor — tudo junto. A Copamar quer ser um ponto firme
          nessa rotina: o lugar onde a fralda chega no prazo, o tamanho está
          certo, o preço cabe no orçamento e alguém responde quando você precisa
          tirar uma dúvida.
        </p>

        <h2 className="text-xl font-semibold text-ui-fg-base mt-4">
          Onde estamos
        </h2>
        <div className="text-base-regular leading-7">
          <p className="text-ui-fg-base font-semibold">Loja física</p>
          <p>
            Rua Iugoslávia, 167 - Parque das Nações
            <br />
            Santo André/SP - CEP 09280-110
          </p>
          <p className="text-ui-fg-base font-semibold mt-4">
            Horário de atendimento
          </p>
          <p>
            Segunda a Sexta: 08h às 17h
            <br />
            Sábados: 09h às 12h
          </p>
          <p className="text-ui-fg-base font-semibold mt-4">Contato</p>
          <p>
            WhatsApp:{" "}
            <a
              href="https://wa.me/5511952050000"
              target="_blank"
              rel="noreferrer"
              className="text-ui-fg-interactive underline"
            >
              (11) 95205-0000
            </a>
            <br />
            E-mail:{" "}
            <a
              href="mailto:vendas@copamarfraldas.com.br"
              className="text-ui-fg-interactive underline"
            >
              vendas@copamarfraldas.com.br
            </a>
          </p>
          <p className="text-ui-fg-base font-semibold mt-4">Redes sociais</p>
          <p>
            Instagram:{" "}
            <a
              href="https://www.instagram.com/copamarfraldas/"
              target="_blank"
              rel="noreferrer"
              className="text-ui-fg-interactive underline"
            >
              @copamarfraldas
            </a>
            <br />
            Facebook:{" "}
            <a
              href="https://www.facebook.com/fraldageriatrica"
              target="_blank"
              rel="noreferrer"
              className="text-ui-fg-interactive underline"
            >
              /fraldageriatrica
            </a>
          </p>
        </div>

        <hr className="my-4 border-ui-border-base" />

        <LocalizedClientLink
          href="/store"
          className="text-large-semi text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
        >
          Conheça nossa linha completa de fraldas geriátricas →
        </LocalizedClientLink>
      </article>
    </div>
  )
}
