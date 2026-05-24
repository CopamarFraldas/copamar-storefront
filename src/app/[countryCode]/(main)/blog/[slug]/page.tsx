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

const SITE_URL = "https://copamarfraldas.com.br"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) {
    return { title: "Artigo não encontrado" }
  }
  const { frontmatter } = post
  return {
    title: frontmatter.title,
    description: frontmatter.description,
    keywords: frontmatter.keywords,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    // drafts não devem ser indexados até o Marco aprovar
    robots: frontmatter.draft ? { index: false, follow: false } : undefined,
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      type: "article",
      publishedTime: frontmatter.publishedAt,
      modifiedTime: frontmatter.updatedAt || frontmatter.publishedAt,
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
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) {
    notFound()
  }
  const { frontmatter, content } = post
  const url = `${SITE_URL}/blog/${slug}`

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
            { name: "Início", url: SITE_URL },
            { name: "Blog", url: `${SITE_URL}/blog` },
            { name: frontmatter.title, url },
          ]),
        ]}
      />

      <article>
        <nav className="text-xsmall-regular text-ui-fg-muted mb-6">
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
        <div className="text-xsmall-regular text-ui-fg-muted mb-8">
          {frontmatter.author} · {formatarData(frontmatter.publishedAt)}
        </div>

        <ArticleContent content={content} />
        <ArticleFaq faqs={frontmatter.faqs} />
      </article>
    </div>
  )
}
