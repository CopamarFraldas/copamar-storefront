import { Metadata } from "next"
import { HttpTypes } from "@medusajs/types"

import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { lerAbsorcao } from "@lib/util/absorcao"
import { getProductPrice } from "@lib/util/get-product-price"
import { inferMarca } from "@lib/util/product-filters"
import { getSiteUrl } from "@lib/util/seo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SeloAbsorcao from "@modules/common/components/selo-absorcao"
import { extrairMedidaCintura } from "@modules/products/components/guia-medidas/extrair"
import AddToCartButton from "@modules/products/components/product-preview/add-to-cart-button"
import { contagemDoTitulo } from "@modules/products/components/product-price"
import Thumbnail from "@modules/products/components/thumbnail"

/**
 * Comparador lado a lado (?p=handle1,handle2,handle3) — a dúvida clássica do
 * nicho: "Tena Slip ou Abena Pants?". Server component; os dados vêm do mesmo
 * listProducts dos grids (fields default já traz description/metadata/estoque).
 * REGRA de produto de saúde: célula sem dado = "—", NUNCA inventar.
 */

const MAX_PRODUTOS = 3

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ p?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryCode } = await params
  return {
    // absolute: senão o template do layout anexa "| Copamar" de novo
    title: { absolute: "Comparar produtos | Copamar Fraldas" },
    // página parametrizada → NUNCA indexar. GOTCHA (Next): `robots` declarado
    // aqui SUBSTITUI o do layout (não mescla) — por isso o objeto completo,
    // incluindo googleBot.
    robots: {
      index: false,
      follow: true,
      nocache: true,
      googleBot: { index: false, follow: true },
    },
    alternates: { canonical: `${getSiteUrl()}/${countryCode}/comparar` },
  }
}

/** célula "sem dado" — padrão da página inteira */
const SemDado = () => (
  <span className="text-ui-fg-muted" aria-label="sem informação">
    —
  </span>
)

export default async function CompararPage({ params, searchParams }: Props) {
  const { countryCode } = await params
  const { p } = await searchParams

  // handles da URL: dedupe + máx 3 (o excedente é ignorado em silêncio)
  const handles = Array.from(
    new Set(
      (p || "")
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean)
    )
  ).slice(0, MAX_PRODUTOS)

  const region = await getRegion(countryCode)
  if (!region) return null

  let products: HttpTypes.StoreProduct[] = []
  if (handles.length > 0) {
    const {
      response: { products: encontrados },
    } = await listProducts({
      countryCode,
      queryParams: { handle: handles, limit: MAX_PRODUTOS } as any,
    })
    // preserva a ORDEM da URL (a API devolve na ordem dela) e descarta
    // handle inexistente sem quebrar a página
    products = handles
      .map((h) => encontrados.find((prod) => prod.handle === h))
      .filter((x): x is HttpTypes.StoreProduct => !!x)
  }

  if (products.length < 2) {
    return (
      <div className="content-container py-12">
        <h1 className="text-2xl font-semibold text-ui-fg-base">
          Comparar produtos
        </h1>
        <div className="mt-8 rounded-large border border-ui-border-base bg-ui-bg-subtle p-8 text-center">
          <p className="text-ui-fg-base">
            Escolha pelo menos <strong>2 produtos</strong> para comparar lado a
            lado.
          </p>
          <p className="mt-2 text-sm text-ui-fg-subtle">
            Na loja, marque a caixinha <strong>⚖ Comparar</strong> nos produtos
            que quiser e toque em &ldquo;Comparar&rdquo; na barra de baixo.
          </p>
          <LocalizedClientLink
            href="/store"
            className="mt-5 inline-block rounded-large bg-copamar-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-copamar-primary-dark"
          >
            Ver todos os produtos
          </LocalizedClientLink>
        </div>
      </div>
    )
  }

  // dados derivados por produto — mesmas fontes do resto do site (NÃO duplicar
  // heurística): preço = getProductPrice, unidades = contagemDoTitulo (regex do
  // feed), absorção = lerAbsorcao (#87), cintura = extrair do GuiaMedidas
  const colunas = products.map((produto) => {
    const preco = getProductPrice({ product: produto }).cheapestPrice
    const unidades = contagemDoTitulo(produto.title)
    const precoUnitario =
      preco?.calculated_price_number && unidades && unidades > 1
        ? (preco.calculated_price_number / unidades).toLocaleString("pt-BR", {
            style: "currency",
            currency: preco.currency_code?.toUpperCase() || "BRL",
          })
        : null
    const absorcao = lerAbsorcao(produto)
    const meta = (produto.metadata || {}) as Record<string, unknown>
    const formato = typeof meta.formato === "string" ? meta.formato : null
    const tamanho = typeof meta.tamanho === "string" ? meta.tamanho : null
    const cintura = extrairMedidaCintura(produto.description)
    const marca = inferMarca(produto.title || "")
    return {
      produto,
      preco,
      unidades,
      precoUnitario,
      absorcao,
      formato,
      tamanho,
      cintura,
      // "Outras" = heurística não reconheceu → não afirmar marca errada
      marca: marca === "Outras" ? null : marca,
    }
  })

  const thLabel =
    "sticky left-0 z-10 w-28 min-w-[6.5rem] bg-ui-bg-base px-3 py-3 text-left align-top text-xs font-semibold uppercase tracking-wide text-ui-fg-subtle small:min-w-[8rem]"
  const tdCell =
    "min-w-[190px] px-3 py-3 align-top text-sm text-ui-fg-base small:min-w-[220px]"

  return (
    <div className="content-container py-8">
      <h1 className="text-2xl font-semibold text-ui-fg-base">
        Comparar produtos
      </h1>
      <p className="mt-1 text-sm text-ui-fg-subtle">
        {products.length} produtos lado a lado — role a tabela para o lado se
        precisar.
      </p>

      {/* a TABELA rola horizontal dentro deste container (mobile) — a página
          nunca rola inteira pro lado; 1ª coluna (rótulos) fica grudada */}
      <div className="mt-6 overflow-x-auto rounded-large border border-ui-border-base">
        <table
          className="w-full border-collapse bg-ui-bg-base"
          data-testid="comparar-tabela"
        >
          <tbody className="divide-y divide-ui-border-base">
            {/* foto */}
            <tr>
              <th scope="row" className={thLabel}>
                <span className="sr-only">Foto</span>
              </th>
              {colunas.map(({ produto }) => (
                <td key={produto.id} className={tdCell}>
                  <LocalizedClientLink
                    href={`/products/${produto.handle}`}
                    className="group block max-w-[220px]"
                  >
                    <Thumbnail
                      thumbnail={produto.thumbnail}
                      images={produto.images}
                      size="full"
                      title={produto.title}
                    />
                  </LocalizedClientLink>
                </td>
              ))}
            </tr>

            {/* nome */}
            <tr>
              <th scope="row" className={thLabel}>
                Produto
              </th>
              {colunas.map(({ produto }) => (
                <td key={produto.id} className={tdCell}>
                  <LocalizedClientLink
                    href={`/products/${produto.handle}`}
                    className="font-medium text-ui-fg-base underline-offset-2 hover:underline"
                  >
                    {produto.title}
                  </LocalizedClientLink>
                </td>
              ))}
            </tr>

            {/* preço */}
            <tr>
              <th scope="row" className={thLabel}>
                Preço
              </th>
              {colunas.map(({ produto, preco }) => (
                <td key={produto.id} className={tdCell}>
                  {preco ? (
                    <span
                      className="text-lg font-bold"
                      data-testid="comparar-preco"
                      data-value={preco.calculated_price_number}
                    >
                      {(produto.variants?.length || 0) > 1 && (
                        <span className="block text-xs font-normal text-ui-fg-subtle">
                          A partir de
                        </span>
                      )}
                      {preco.calculated_price}
                    </span>
                  ) : (
                    <SemDado />
                  )}
                </td>
              ))}
            </tr>

            {/* ≈ R$/unidade */}
            <tr>
              <th scope="row" className={thLabel}>
                ≈ Por unidade
              </th>
              {colunas.map(({ produto, precoUnitario }) => (
                <td key={produto.id} className={tdCell}>
                  {precoUnitario ? (
                    <span data-testid="comparar-preco-unitario">
                      ≈ <span className="font-semibold">{precoUnitario}</span>
                      /un
                    </span>
                  ) : (
                    <SemDado />
                  )}
                </td>
              ))}
            </tr>

            {/* absorção (gotas 1-5, #87) */}
            <tr>
              <th scope="row" className={thLabel}>
                Absorção
              </th>
              {colunas.map(({ produto, absorcao }) => (
                <td key={produto.id} className={tdCell}>
                  {absorcao ? (
                    <SeloAbsorcao product={produto} variante="card" />
                  ) : (
                    <SemDado />
                  )}
                </td>
              ))}
            </tr>

            {/* tipo (metadata formato) */}
            <tr>
              <th scope="row" className={thLabel}>
                Tipo
              </th>
              {colunas.map(({ produto, formato }) => (
                <td key={produto.id} className={tdCell}>
                  {formato || <SemDado />}
                </td>
              ))}
            </tr>

            {/* uso noturno — só afirma quando a régua #87 existe no produto */}
            <tr>
              <th scope="row" className={thLabel}>
                Uso noturno
              </th>
              {colunas.map(({ produto, absorcao }) => (
                <td key={produto.id} className={tdCell}>
                  {absorcao ? (
                    absorcao.noturno ? (
                      <span>
                        Sim <span aria-hidden="true">🌙</span>
                      </span>
                    ) : (
                      "Não"
                    )
                  ) : (
                    <SemDado />
                  )}
                </td>
              ))}
            </tr>

            {/* tamanho / cintura (extraído da descrição, como o GuiaMedidas) */}
            <tr>
              <th scope="row" className={thLabel}>
                Tamanho / cintura
              </th>
              {colunas.map(({ produto, tamanho, cintura }) => (
                <td key={produto.id} className={tdCell}>
                  {tamanho || cintura ? (
                    <>
                      {tamanho && (
                        <span className="font-medium">{tamanho}</span>
                      )}
                      {tamanho && cintura && " · "}
                      {cintura && (
                        <span className="text-ui-fg-subtle">
                          cintura {cintura}
                        </span>
                      )}
                    </>
                  ) : (
                    <SemDado />
                  )}
                </td>
              ))}
            </tr>

            {/* unidades por pacote */}
            <tr>
              <th scope="row" className={thLabel}>
                Unid. por pacote
              </th>
              {colunas.map(({ produto, unidades }) => (
                <td key={produto.id} className={tdCell}>
                  {unidades ? `${unidades} un` : <SemDado />}
                </td>
              ))}
            </tr>

            {/* marca */}
            <tr>
              <th scope="row" className={thLabel}>
                Marca
              </th>
              {colunas.map(({ produto, marca }) => (
                <td key={produto.id} className={tdCell}>
                  {marca || <SemDado />}
                </td>
              ))}
            </tr>

            {/* ações */}
            <tr>
              <th scope="row" className={thLabel}>
                <span className="sr-only">Ações</span>
              </th>
              {colunas.map(({ produto }) => (
                <td key={produto.id} className={tdCell}>
                  <div className="flex max-w-[260px] flex-col gap-y-2">
                    <LocalizedClientLink
                      href={`/products/${produto.handle}`}
                      className="block rounded-large bg-copamar-primary px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-copamar-primary-dark"
                      data-testid="comparar-ver-produto"
                    >
                      Ver produto
                    </LocalizedClientLink>
                    {/* mesmo botão dos cards: 1 variante = 1 clique; quick-select
                        de tamanho; esgotado = desabilitado */}
                    <AddToCartButton product={produto} />
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ui-fg-muted">
        &ldquo;—&rdquo; = informação não disponível para este produto.
      </p>
    </div>
  )
}
