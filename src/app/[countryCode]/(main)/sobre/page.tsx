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
          Há 20 anos cuidando de quem cuida — uma história que começou em uma
          loja de bairro na zona norte de São Paulo e atravessou três endereços
          até encontrar o seu lugar.
        </p>

        <h2 className="text-xl font-semibold text-ui-fg-base mt-4">
          A loja que começou no Tucuruvi
        </h2>
        <p className="text-base-regular leading-7">
          Foi a{" "}
          <strong className="font-semibold text-ui-fg-base">
            visão estratégica do Seu Francisco
          </strong>{" "}
          — nosso pai — que deu origem à Copamar. Em{" "}
          <strong className="font-semibold text-ui-fg-base">
            16 de maio de 2006
          </strong>
          , ele abriu a primeira loja no{" "}
          <strong className="font-semibold text-ui-fg-base">
            Tucuruvi, zona norte de São Paulo
          </strong>
          .
        </p>
        <p className="text-base-regular leading-7">
          No começo, ainda não era a distribuidora especializada que somos hoje.
          Era a <strong className="font-semibold text-ui-fg-base">
            Copamar Comércio e Produtos
          </strong>{" "}
          — uma loja generalista, daquelas que vendem um pouco de tudo, onde o
          cliente conhece o dono pelo nome e volta porque confia.
        </p>

        <h2 className="text-xl font-semibold text-ui-fg-base mt-4">
          O insight que mudou o rumo
        </h2>
        <p className="text-base-regular leading-7">
          Observando o movimento da loja dia após dia, Seu Francisco notou um
          padrão:{" "}
          <strong className="font-semibold text-ui-fg-base">
            as fraldas geriátricas saíam diferente
          </strong>
          . Cuidadores cansados entravam buscando o mesmo produto toda semana.
          Famílias inteiras dependendo daquela compra. Mães e filhos que não
          conseguiam errar — porque a pessoa querida estava esperando em casa.
        </p>
        <p className="text-base-regular leading-7">
          Em vez de continuar vendendo de tudo um pouco, ele decidiu algo raro
          pra um lojista de bairro:{" "}
          <strong className="font-semibold text-ui-fg-base">especializar</strong>
          . Aos poucos, foi substituindo os itens variados por mais e mais
          fraldas. Uma decisão difícil — abandonar a "segurança do tudo" pra
          apostar no nicho — que se mostrou visionária.
        </p>

        <h2 className="text-xl font-semibold text-ui-fg-base mt-4">
          Crescemos, tropeçamos, aprendemos
        </h2>
        <p className="text-base-regular leading-7">
          Com a especialização funcionando, decidimos crescer. Abrimos uma
          segunda unidade em{" "}
          <strong className="font-semibold text-ui-fg-base">
            São Caetano do Sul
          </strong>
          , expandindo o atendimento para o ABC paulista.
        </p>
        <p className="text-base-regular leading-7">
          Não deu certo do jeito que esperávamos.{" "}
          <strong className="font-semibold text-ui-fg-base">
            Problemas com o proprietário do imóvel em São Caetano
          </strong>{" "}
          nos obrigaram a sair. Em vez de desistir do ABC, mudamos a operação
          para <strong className="font-semibold text-ui-fg-base">
            Santo André
          </strong>{" "}
          — onde encontramos um ponto melhor, um bairro com mais movimento de
          cuidadores e proximidade com asilos e casas de repouso.
        </p>
        <p className="text-base-regular leading-7">
          E aí veio o segundo aprendizado, em paralelo.{" "}
          <strong className="font-semibold text-ui-fg-base">Em Tucuruvi</strong>
          , o dono do imóvel vendeu o ponto, e o novo proprietário quis{" "}
          <strong className="font-semibold text-ui-fg-base">
            dobrar o aluguel
          </strong>{" "}
          da noite pro dia. Não havia conversa.
        </p>
        <p className="text-base-regular leading-7">
          Nesse momento, Seu Francisco tomou a decisão que define o atacadista
          bom do mediano:{" "}
          <strong className="font-semibold text-ui-fg-base">
            consolidar em vez de insistir
          </strong>
          . Fechamos o Tucuruvi e concentramos tudo em Santo André — que hoje é
          nossa{" "}
          <strong className="font-semibold text-ui-fg-base">
            loja física + centro de distribuição
          </strong>
          , atendendo a Grande SP presencialmente e o Brasil inteiro via online.
        </p>
        <p className="text-base-regular leading-7">
          Foi uma escolha estratégica que parecia perda na hora, mas se mostrou
          ganho:{" "}
          <strong className="font-semibold text-ui-fg-base">
            um centro forte vale mais que dois pontos enfraquecidos
          </strong>
          .
        </p>

        <h2 className="text-xl font-semibold text-ui-fg-base mt-4">
          O nome carregava o futuro desde o primeiro dia
        </h2>
        <p className="text-base-regular leading-7">
          <strong className="font-semibold text-ui-fg-base">COPAMAR</strong> não
          é um acrônimo qualquer:
        </p>
        <ul className="list-disc pl-6 flex flex-col gap-y-1 text-base-regular leading-7">
          <li>
            <strong className="font-semibold text-ui-fg-base">CO</strong> de
            Comércio
          </li>
          <li>
            <strong className="font-semibold text-ui-fg-base">PA</strong> de
            Paulo
          </li>
          <li>
            <strong className="font-semibold text-ui-fg-base">MAR</strong> de
            Marco
          </li>
        </ul>
        <p className="text-base-regular leading-7">
          Quando Seu Francisco escolheu esse nome em 2006, ele já tinha um plano.
          Pensava em passar a empresa pros dois filhos — antes mesmo da loja
          vender a primeira fralda.{" "}
          <strong className="font-semibold text-ui-fg-base">
            O nome carrega essa intenção desde o primeiro dia.
          </strong>
        </p>

        <h2 className="text-xl font-semibold text-ui-fg-base mt-4">
          Em 2021, a próxima geração assumiu
        </h2>
        <p className="text-base-regular leading-7">
          Após{" "}
          <strong className="font-semibold text-ui-fg-base">
            15 anos construindo a Copamar do zero
          </strong>{" "}
          — três endereços, um pivô estratégico, duas mudanças, uma consolidação
          — Seu Francisco passou a direção para os dois filhos:{" "}
          <strong className="font-semibold text-ui-fg-base">
            Paulo Henrique
          </strong>{" "}
          e{" "}
          <strong className="font-semibold text-ui-fg-base">
            Marco Aurellio
          </strong>
          .
        </p>
        <p className="text-base-regular leading-7">
          Ele segue conosco como{" "}
          <strong className="font-semibold text-ui-fg-base">
            consultor honorário
          </strong>
          . Sempre presente, sempre lembrando que o que diferencia a Copamar é a
          forma como cada cuidador é tratado, e não o produto em si. A
          experiência de quem construiu o negócio do zero não se aposenta.
        </p>
        <p className="text-base-regular leading-7">
          A divisão do dia a dia hoje:
        </p>
        <p className="text-base-regular leading-7">
          <strong className="font-semibold text-ui-fg-base">Marco</strong>,
          formado em{" "}
          <strong className="font-semibold text-ui-fg-base">
            Administração pela FGV
          </strong>
          , cuida da estratégia, da operação digital (e-commerce, sistemas,
          automações) e também está presente na loja física. Faz as duas pontas
          — tecnologia e atendimento.
        </p>
        <p className="text-base-regular leading-7">
          <strong className="font-semibold text-ui-fg-base">Paulo</strong>, em
          aperfeiçoamento constante via{" "}
          <strong className="font-semibold text-ui-fg-base">
            G4 Educação
          </strong>
          , foca em{" "}
          <strong className="font-semibold text-ui-fg-base">
            modernizar o atendimento
          </strong>
          , gestão de varejo e relacionamento direto com o cuidador. É a cara
          que recebe quem chega na loja.
        </p>
        <p className="text-base-regular leading-7">
          Dois irmãos dividindo a empresa que carrega seus nomes — crescendo na
          velocidade de cada nova geração de cuidadores brasileiros que chega até
          nós.
        </p>

        <h2 className="text-xl font-semibold text-ui-fg-base mt-4">
          O que mantivemos desde o começo
        </h2>
        <ul className="list-disc pl-6 flex flex-col gap-y-3 text-base-regular leading-7">
          <li>
            <strong className="font-semibold text-ui-fg-base">
              Especialização exclusiva
            </strong>{" "}
            — distribuímos apenas fraldas geriátricas, absorventes e produtos de
            higiene para idosos. Não é um departamento. É a empresa inteira.
          </li>
          <li>
            <strong className="font-semibold text-ui-fg-base">
              Tradição em atacado
            </strong>{" "}
            — trabalhamos com grandes volumes para garantir o preço mais justo.
            Atendemos asilos, casas de repouso, home care e cuidadores
            familiares com o mesmo cuidado.
          </li>
          <li>
            <strong className="font-semibold text-ui-fg-base">
              Atendimento próximo
            </strong>{" "}
            — quando você liga ou manda WhatsApp, fala com gente que entende. Não
            é call center. É a Copamar mesmo — desde 2006.
          </li>
          <li>
            <strong className="font-semibold text-ui-fg-base">
              Condições reais
            </strong>{" "}
            — parcelamento em até 3x sem juros e 5% de desconto no pagamento
            à vista. Sem letra miúda.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-ui-fg-base mt-4">
          Cuidador como bússola
        </h2>
        <p className="text-base-regular leading-7">
          Sabemos que cuidar de uma pessoa querida que envelheceu ou ficou doente
          é uma das experiências mais densas que existem. Cansaço, dúvida, culpa,
          amor — tudo junto.
        </p>
        <p className="text-base-regular leading-7">
          A Copamar quer ser um ponto firme nessa rotina: o lugar onde a fralda
          chega no prazo, o tamanho está certo, o preço cabe no orçamento e
          alguém responde quando você precisa tirar uma dúvida.
        </p>
        <p className="text-base-regular leading-7">
          Foi pra isso que Seu Francisco abriu a primeira loja em 2006 — primeiro
          no Tucuruvi, depois pelo ABC, hoje em Santo André. É pra isso que
          continuamos aqui.
        </p>

        <h2 className="text-xl font-semibold text-ui-fg-base mt-4">
          Onde estamos
        </h2>
        <div className="text-base-regular leading-7">
          <p className="text-ui-fg-base font-semibold">
            Loja física + Centro de Distribuição
          </p>
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
