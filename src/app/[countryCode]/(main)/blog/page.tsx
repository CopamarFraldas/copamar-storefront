import { Metadata } from "next"
import { getAllPosts } from "@lib/data/blog"
import ArticleCard from "@modules/blog/components/article-card"
import { breadcrumbSchema, JsonLd } from "@modules/common/components/structured-data"
import { getSiteUrl } from "@lib/util/seo"

type Props = { params: Promise<{ countryCode: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryCode } = await params
  return {
    title: "Blog — Guias sobre Fraldas Geriátricas e Cuidado de Idosos",
    description:
      "Guias e conteúdos da Copamar sobre fraldas geriátricas, incontinência e cuidado de pessoas idosas e acamadas. 20 anos de experiência a serviço de cuidadores.",
    alternates: { canonical: `${getSiteUrl()}/${countryCode}/blog` },
  }
}

export default async function BlogPage({ params }: Props) {
  const { countryCode } = await params
  const base = `${getSiteUrl()}/${countryCode}`
  const posts = getAllPosts()

  return (
    <div className="content-container py-12">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Início", url: base },
          { name: "Blog", url: `${base}/blog` },
        ])}
      />
      <h1 className="text-3xl font-semibold text-ui-fg-base mb-2">
        Blog Copamar
      </h1>
      <p className="text-base-regular text-ui-fg-subtle mb-8 max-w-2xl">
        Guias práticos sobre fraldas geriátricas e cuidado de idosos, escritos
        por quem é especialista no assunto há 20 anos.
      </p>

      {posts.length === 0 ? (
        <p className="text-ui-fg-subtle">Em breve, novos conteúdos.</p>
      ) : (
        <div className="grid grid-cols-1 small:grid-cols-2 gap-6">
          {posts.map((p) => (
            <ArticleCard key={p.frontmatter.slug} post={p} />
          ))}
        </div>
      )}
    </div>
  )
}
