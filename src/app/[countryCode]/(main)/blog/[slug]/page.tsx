import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPostBySlug } from "@lib/data/blog"
import ArticleContent from "@modules/blog/components/article-content"
import ArticleFaq from "@modules/blog/components/article-faq"
import {
  articleSchema,
  breadcrumbSchema,
  JsonLd,
} from "@modules/common/components/structured-data"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getSiteUrl, robotsMeta } from "@lib/util/seo"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, countryCode } = await params
  const post = getPostBySlug(slug)
  if (!post) {
    return { title: "Artigo não encontrado" }
  }
  const { frontmatter } = post
  return {
    title: frontmatter.title,
    description: frontmatter.description,
    keywords: frontmatter.keywords,
    alternates: { canonical: `${getSiteUrl()}/${countryCode}/blog/${slug}` },
    // drafts: noindex sempre. Publicados herdam o robots env-consciente do site
    // (noindex em staging, index só no cutover). Antes era `undefined`, que
    // SOBRESCREVIA o noindex do layout → o post publicado vazava pro Google.
    robots: frontmatter.draft ? { index: false, follow: false } : robotsMeta(),
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      type: "article",
      publishedTime: frontmatter.publishedAt,
      modifiedTime: frontmatter.updatedAt || frontmatter.publishedAt,
      // OG da página SUBSTITUI o do layout — garante og:image no share
      images: [
        {
          url: frontmatter.image
            ? (frontmatter.image.startsWith("http") ? frontmatter.image : `${getSiteUrl()}${frontmatter.image}`)
            : `${getSiteUrl()}/og-image.png`,
          width: 1200,
          height: 630,
          alt: frontmatter.title,
        },
      ],
    },
  }
}

const formatarData = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug, countryCode } = await params
  const post = getPostBySlug(slug)
  if (!post) {
    notFound()
  }
  const { frontmatter, content } = post
  const base = `${getSiteUrl()}/${countryCode}`
  const url = `${base}/blog/${slug}`

  return (
    <div className="content-container py-12">
      <JsonLd
        data={[
          articleSchema({
            title: frontmatter.title,
            description: frontmatter.description,
            url,
            image: frontmatter.image,
            publishedAt: frontmatter.publishedAt,
            updatedAt: frontmatter.updatedAt,
            author: frontmatter.author,
          }),
          breadcrumbSchema([
            { name: "Início", url: base },
            { name: "Blog", url: `${base}/blog` },
            { name: frontmatter.title, url },
          ]),
        ]}
      />

      <article>
        <nav className="text-xsmall-regular text-ui-fg-subtle mb-6">
          <LocalizedClientLink href="/blog" className="hover:text-ui-fg-base">
            Blog
          </LocalizedClientLink>
          {" / "}
          <span>{frontmatter.title}</span>
        </nav>

        {frontmatter.draft && (
          <span className="inline-block text-xsmall-semi uppercase bg-yellow-100 text-yellow-800 rounded px-2 py-1 mb-4">
            Rascunho — em revisão
          </span>
        )}

        <h1 className="text-3xl font-semibold text-ui-fg-base mb-3 max-w-2xl">
          {frontmatter.title}
        </h1>
        <div className="text-xsmall-regular text-ui-fg-subtle mb-8">
          {frontmatter.author} · {formatarData(frontmatter.publishedAt)}
        </div>

        <ArticleContent content={content} />
        {/* CTA pra loja (Manus 10/07): o blog traz tráfego informativo — converte aqui */}
        <aside className="my-10 rounded-large border border-ui-border-base bg-copamar-bg-light p-6 text-center dark:bg-ui-bg-subtle">
          <p className="text-lg font-semibold text-ui-fg-base">
            Precisando de fraldas geriátricas ou produtos de higiene?
          </p>
          <p className="mt-1 text-sm text-ui-fg-subtle">
            Atacado e varejo, direto das fábricas — entrega para todo o Brasil e{" "}
            <strong>5% de desconto no PIX</strong>.
          </p>
          <LocalizedClientLink
            href="/store"
            className="mt-4 inline-block rounded-full bg-copamar-cta px-6 py-2.5 font-semibold text-white transition-opacity hover:opacity-90"
          >
            Ver produtos da loja →
          </LocalizedClientLink>
        </aside>
        <ArticleFaq faqs={frontmatter.faqs} />
      </article>
    </div>
  )
}
